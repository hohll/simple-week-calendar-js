/* Agendo demo server: serves the demo and stores its events in a database (no dependencies).
 *
 *   node server/server.js                 http://localhost:8000, database server/agendo.db
 *   node server/server.js --port 3000 --db /tmp/agenda.db
 *   node server/server.js --reset         start from an empty database (then the sample events)
 *   node server/server.js --no-seed       do not add the sample events to a new database
 *
 * Storage: SQLite through Node's built-in node:sqlite (Node 22.13+ / 23.4+); on older versions,
 * a JSON file next to the database path (server/agendo.json).
 *
 * REST API (JSON):
 *   GET    /api/health                      { ok, storage, events }
 *   GET    /api/events?start=ISO&end=ISO    events overlapping [start, end), and recurring events
 *                                           starting before end (their occurrences can be anywhere)
 *   GET    /api/events/:id
 *   POST   /api/events                      create (or replace) an event → 201 + the event
 *   PUT    /api/events/:id                  replace an event → 200 + the event
 *   DELETE /api/events/:id                  → 204
 * An event is stored whole (custom fields included) with its time span indexed for range queries.
 * Dates: ISO instants ('2026-11-20T08:00:00.000Z'), all-day events as 'YYYY-MM-DD'.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const PORT = +(opt('--port', process.env.PORT || 8000));
const HOST = opt('--host', '127.0.0.1');
const DB_FILE = path.resolve(opt('--db', path.join(__dirname, 'agendo.db')));
const DAY = 864e5;

// --- Storage: the same small interface over SQLite or a JSON file ---

// Time span used for range queries. All-day dates ('YYYY-MM-DD') read as UTC midnight, so queries
// are widened by a day on each side to cover every time zone.
function span(ev) {
  const start = Date.parse(ev.start), end = ev.end ? Date.parse(ev.end) : start + 36e5;
  return { start, end: Math.max(end, start), recurring: ev.recurrence ? 1 : 0 };
}

function sqliteStore(file) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id         TEXT PRIMARY KEY,
      start_ms   INTEGER NOT NULL,
      end_ms     INTEGER NOT NULL,
      recurring  INTEGER NOT NULL DEFAULT 0,
      data       TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS events_range ON events (start_ms, end_ms);
    CREATE INDEX IF NOT EXISTS events_recurring ON events (recurring, start_ms);`);
  const q = {
    all: db.prepare('SELECT data FROM events'),
    range: db.prepare('SELECT data FROM events WHERE (start_ms < ? AND end_ms > ?) OR (recurring = 1 AND start_ms < ?)'),
    get: db.prepare('SELECT data FROM events WHERE id = ?'),
    put: db.prepare(`INSERT INTO events (id, start_ms, end_ms, recurring, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET start_ms = excluded.start_ms, end_ms = excluded.end_ms,
      recurring = excluded.recurring, data = excluded.data, updated_at = excluded.updated_at`),
    remove: db.prepare('DELETE FROM events WHERE id = ?'),
    count: db.prepare('SELECT COUNT(*) AS n FROM events')
  };
  const parse = rows => rows.map(r => JSON.parse(r.data));
  return {
    kind: 'sqlite',
    file,
    list(from, to) {
      if (from == null || to == null) return parse(q.all.all());
      return parse(q.range.all(to + DAY, from - DAY, to + DAY));
    },
    get(id) { const r = q.get.get(id); return r ? JSON.parse(r.data) : null; },
    put(ev) { const s = span(ev); q.put.run(ev.id, s.start, s.end, s.recurring, JSON.stringify(ev), new Date().toISOString()); },
    putMany(list) {
      db.exec('BEGIN');
      try { for (const ev of list) this.put(ev); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    remove(id) { return q.remove.run(id).changes > 0; },
    count() { return q.count.get().n; }
  };
}

function jsonStore(file) {
  let events = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  const save = () => fs.writeFileSync(file, JSON.stringify(events, null, 1));
  return {
    kind: 'json',
    file,
    list(from, to) {
      if (from == null || to == null) return events;
      return events.filter(ev => { const s = span(ev); return (s.start < to + DAY && s.end > from - DAY) || (s.recurring && s.start < to + DAY); });
    },
    get(id) { return events.find(e => e.id === id) ?? null; },
    put(ev) { events = events.filter(e => e.id !== ev.id).concat(ev); save(); },
    putMany(list) { const ids = new Set(list.map(e => e.id)); events = events.filter(e => !ids.has(e.id)).concat(list); save(); },
    remove(id) { const n = events.length; events = events.filter(e => e.id !== id); save(); return events.length < n; },
    count() { return events.length; }
  };
}

function openStore() {
  if (args.includes('--reset')) for (const f of [DB_FILE, DB_FILE.replace(/\.db$/, '') + '.json']) fs.rmSync(f, { force: true });
  try {
    // node:sqlite prints an "experimental" warning on load: drop that one only.
    const emit = process.emitWarning;
    process.emitWarning = (w, ...rest) => (/SQLite/.test(String(w?.message ?? w)) ? undefined : emit.call(process, w, ...rest));
    return sqliteStore(DB_FILE);
  } catch (err) {
    if (err.code !== 'ERR_UNKNOWN_BUILTIN_MODULE' && !/sqlite/.test(err.message)) throw err;
    return jsonStore(DB_FILE.replace(/\.db$/, '') + '.json');
  }
}

// --- Events: checked before they are stored ---

const isDate = v => typeof v === 'string' && !isNaN(Date.parse(v));

function clean(body, id) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Object.assign(new Error('An event object is expected'), { status: 400 });
  const ev = { ...body, id: String(id ?? body.id ?? crypto.randomUUID()) };
  if (!isDate(ev.start)) throw Object.assign(new Error('"start" must be a date (ISO 8601)'), { status: 400 });
  if (ev.end != null && !isDate(ev.end)) throw Object.assign(new Error('"end" must be a date (ISO 8601)'), { status: 400 });
  if (ev.title != null) ev.title = String(ev.title).slice(0, 500);
  delete ev.recurringId;   // occurrences are generated by the calendar, only series are stored
  delete ev.occurrence;
  return ev;
}

// The demo's sample events, moved to the current week (as the demo page does).
function sampleEvents() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'events.json'), 'utf8'));
  const parse = s => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00`) : new Date(s));
  const monday = s => { const d = parse(s); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
  const days = Math.round((monday(new Date()) - monday(data[0].start)) / DAY);
  const pad = n => String(n).padStart(2, '0');
  const shift = (s, allDay) => {
    if (s == null) return s;
    const d = parse(s);
    d.setDate(d.getDate() + days);
    return allDay ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : d.toISOString();
  };
  return data.map(e => ({ ...e, start: shift(e.start, e.allDay), end: shift(e.end, e.allDay) }));
}

// --- HTTP ---

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8'
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body === undefined ? undefined : type.startsWith('application/json') ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > 1e6) { reject(Object.assign(new Error('Body too large'), { status: 413 })); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null); }
      catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

// Static files of the demo only: no dot files (.git), nothing from server/ (the database).
function serveStatic(req, res, pathname) {
  const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const file = path.resolve(ROOT, `.${rel}`);
  const type = TYPES[path.extname(file)];
  if (!file.startsWith(ROOT + path.sep) || rel.split('/').some(p => p.startsWith('.')) ||
      file.startsWith(path.join(ROOT, 'server') + path.sep) || !type) return send(res, 404, { error: 'Not found' });
  fs.readFile(file, (err, data) => (err ? send(res, 404, { error: 'Not found' }) : send(res, 200, data, type)));
}

const store = openStore();
if (store.count() === 0 && !args.includes('--no-seed')) store.putMany(sampleEvents().map(e => clean(e)));

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const match = /^\/api\/events(?:\/([^/]+))?\/?$/.exec(url.pathname);
  try {
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, storage: store.kind, events: store.count() });
    if (!match) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
      return serveStatic(req, res, url.pathname);
    }
    const id = match[1] && decodeURIComponent(match[1]);
    switch (`${req.method} ${id ? 'item' : 'list'}`) {
      case 'GET list': {
        const from = url.searchParams.get('start'), to = url.searchParams.get('end');
        if ((from && !isDate(from)) || (to && !isDate(to))) return send(res, 400, { error: 'start and end must be ISO dates' });
        return send(res, 200, store.list(from ? Date.parse(from) : null, to ? Date.parse(to) : null));
      }
      case 'GET item': {
        const ev = store.get(id);
        return ev ? send(res, 200, ev) : send(res, 404, { error: 'No such event' });
      }
      case 'POST list': {
        const ev = clean(await readBody(req));
        store.put(ev);
        return send(res, 201, ev);
      }
      case 'PUT item': {
        const ev = clean(await readBody(req), id);
        store.put(ev);
        return send(res, 200, ev);
      }
      case 'DELETE item':
        return store.remove(id) ? send(res, 204) : send(res, 404, { error: 'No such event' });
      default:
        return send(res, 405, { error: 'Method not allowed' });
    }
  } catch (err) {
    send(res, err.status || 500, { error: err.status ? err.message : 'Server error' });
    if (!err.status) console.error(err);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Agendo demo on http://${HOST === '127.0.0.1' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Events stored in ${store.file} (${store.kind}, ${store.count()} events)`);
});

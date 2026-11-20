/* Agendo plugin: restStorage — events kept in a database behind a REST API.
 *
 *   <script src="plugins/rest-storage.js"></script>
 *   new Agendo('#calendar', { plugins: [Agendo.restStorage({ url: '/api/events' })] });
 *
 * Loading: the events of the dates on screen are fetched by whole months (GET url?start=&end=),
 * once per month; recurring events come with every range (their occurrences can be anywhere).
 * Saving: every change made in the calendar (form, drag, resize, recurring "this / following /
 * all", delete) is sent: POST url (new event), PUT url/:id (changed), DELETE url/:id.
 * Changes made through the API (addEvent, updateEvent, deleteEvent, setEvents) are not sent:
 * call save(event) / remove(id) for those.
 *
 * Options: url, headers ({ Authorization: … }), onError(error, what) (default: calendar.notify).
 * API: calendar.getPlugin('restStorage') → { reload(), save(event), remove(id), health(), pending }
 * The server of the demo is server/server.js (Node.js, SQLite). Dates are sent as ISO instants,
 * all-day ones as 'YYYY-MM-DD'.
 */
(function () {
  const pad = n => String(n).padStart(2, '0');
  const day = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const monthKey = d => d.getFullYear() * 12 + d.getMonth();

  function restStorage({ url = '/api/events', headers = {}, onError = null } = {}) {
    let calendar;
    const loaded = new Set();   // months already fetched (year * 12 + month)
    let pending = 0;

    const fail = (err, what) => (onError ? onError(err, what) : calendar.notify(`${what}: ${err.message}`, 6000));

    async function request(method, path, body) {
      pending++;
      try {
        const res = await fetch(url + path, {
          method,
          headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
          body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
        return res.status === 204 ? null : res.json();
      } finally {
        pending--;
      }
    }

    // An event as stored: the series (never an occurrence), dates as text.
    function serialize(ev) {
      const out = { ...ev };
      delete out.recurringId;
      delete out.occurrence;
      out.start = ev.allDay ? day(ev.start) : ev.start.toISOString();
      out.end = ev.allDay ? day(ev.end) : ev.end.toISOString();
      return out;
    }

    // Fetches the months of [from, to) not fetched yet, and adds the events not already there.
    async function load(from, to) {
      const months = [];
      for (let m = monthKey(from); m <= monthKey(new Date(+to - 1)); m++) if (!loaded.has(m)) months.push(m);
      if (!months.length) return;
      months.forEach(m => loaded.add(m));
      const first = new Date(Math.floor(months[0] / 12), months[0] % 12, 1);
      const last = new Date(Math.floor(months.at(-1) / 12), (months.at(-1) % 12) + 1, 1);
      try {
        const events = await request('GET', `?start=${encodeURIComponent(first.toISOString())}&end=${encodeURIComponent(last.toISOString())}`);
        const have = new Set(calendar.getEvents().map(e => e.id));
        const fresh = events.filter(e => !have.has(String(e.id)));
        if (fresh.length) calendar.setEvents([...calendar.getEvents(), ...fresh]);
      } catch (err) {
        months.forEach(m => loaded.delete(m));   // try again next time
        fail(err, 'Could not load the events');
      }
    }

    const save = ev => request('PUT', `/${encodeURIComponent(ev.id)}`, serialize(ev)).catch(err => fail(err, `Could not save "${ev.title}"`));
    const remove = id => request('DELETE', `/${encodeURIComponent(id)}`).catch(err => fail(err, 'Could not delete the event'));

    return {
      name: 'restStorage',
      install(cal) { calendar = cal; },
      datesSet(from, to) { load(from, to); },
      eventCreated(ev) { request('POST', '', serialize(ev)).catch(err => fail(err, `Could not save "${ev.title}"`)); },
      eventChanged(ev) { save(ev); },
      eventDeleted(id) { remove(id); },

      // Forget what was loaded and fetch the dates on screen again.
      reload() {
        loaded.clear();
        calendar.setEvents([]);
      },
      save,
      remove,
      health: () => fetch(new URL('../health', new URL(url + '/', location.href)), { headers }).then(r => r.json()),
      get pending() { return pending; }
    };
  }

  if (typeof Agendo !== 'undefined') Agendo.restStorage = restStorage;
  if (typeof window !== 'undefined') window.AgendoRestStorage = restStorage;
})();

// Demo: create the calendar straight away, then load events.json into it.
// (fetch needs a local server — over file:// the calendar just starts empty.)
// The Customize sidebar changes the options: each change rebuilds the calendar with them,
// keeping its events, date, view and filter.

const toast = document.getElementById('log-toast');
let toastTimer;

function logAction(msg) {
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.style.display = 'none'), 4000);
}

const fmt = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// --- Sample data ---

const RESOURCES = [
  { id: 'desk-1', title: 'Desk 1', color: '#3b82f6' },
  { id: 'desk-2', title: 'Desk 2', color: '#10b981' },
  { id: 'desk-3', title: 'Desk 3', color: '#f59e0b' }
];
const CALENDARS = [
  { id: 'work', title: 'Work', color: '#2563eb' },
  { id: 'personal', title: 'Personal', color: '#db2777' }
];
const CATEGORIES = [
  { id: 'meeting', title: 'Meeting', color: '#3b82f6' },
  { id: 'workshop', title: 'Workshop', color: '#f59e0b' },
  { id: 'social', title: 'Social', color: '#10b981' },
  { id: 'sport', title: 'Sport', color: '#ec4899' }
];
// The eventDataModel plugin's example: what an event holds, beyond the core fields.
const DEMO_MODEL = {
  fields: [
    { name: 'location', label: 'Location', type: 'text', placeholder: 'Room, address or link' },
    { name: 'priority', label: 'Priority', type: 'select', default: 'normal', popover: true,
      badge: v => ({ high: 'High', low: 'Low' })[v] ?? null,   // no badge for "normal"
      options: [{ value: 'low', label: 'Low', color: '#64748b' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High', color: '#dc2626' }] },
    { name: 'attendees', label: 'Attendees', type: 'number', min: 1, max: 50, popover: true,
      validate: (v, data) => (v > 20 && !data.online ? 'More than 20 attendees: make it an online meeting' : null) },
    { name: 'online', label: 'Online meeting', type: 'checkbox', badge: 'Online', popover: true },
    { name: 'description', label: 'Notes', type: 'textarea', help: 'Shown in the hover card' }
  ],
  order: ['title', 'location', 'priority']
};
const TIMELINE_CUSTOM = { days: 3, slotMinutes: 30, labelMinutes: 60, label: '3 days' };
const ALL_VIEWS = ['day', 'workweek', 'week', 'month', 'year', 'list', 'resource', 'timeline'];

// --- Settings (what the sidebar edits) ---

const DEFAULTS = {
  theme: '',
  colorScheme: 'auto',
  views: ALL_VIEWS,
  locale: '',
  firstDayOfWeek: 1,
  use24Hour: false,
  weekNumbers: false,
  startHour: 7,
  endHour: 21,
  businessStart: 9,
  businessEnd: 18,
  slotsPerHour: 4,
  slotHeight: 22,
  showCurrentTime: true,
  allDaySlot: true,
  monthMaxEvents: 3,
  resources: true,
  timelineCustom: true,
  filters: true,
  readonly: false,
  enableCreate: true,
  enableMove: true,
  enableResize: true,
  openEventOn: 'click',
  eventPopover: true,
  enableAllDay: true,
  enableRecurring: true,
  // Plugins
  holidays: '',
  holidaysDisplay: 'background',
  conflicts: false,
  conflictsBlock: true,
  ical: false,
  timeProgress: false,
  dataModel: false,
  storage: false
};
const STORE = 'ago-demo-settings';

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    const s = { ...DEFAULTS, ...saved };
    if (s.theme && !['tabler', 'bootstrap', 'bulma'].includes(s.theme)) s.theme = '';  // a theme that was removed
    if (!['light', 'dark', 'auto'].includes(s.colorScheme)) s.colorScheme = DEFAULTS.colorScheme;
    return s;
  } catch { return { ...DEFAULTS }; }
}

function saveSettings() {
  try { localStorage.setItem(STORE, JSON.stringify(settings)); } catch { /* storage unavailable */ }
}

let settings = loadSettings();

// The plugins the Plugins section turns on, with the code to show for each.
function pluginsOf(s) {
  return [
    s.holidays && [Agendo.holidays({ country: s.holidays, display: s.holidaysDisplay }),
      `Agendo.holidays({ country: '${s.holidays}'${s.holidaysDisplay === 'auto' ? ", display: 'auto'" : ''} })`],
    s.conflicts && [Agendo.conflicts({ by: 'resource', block: s.conflictsBlock }),
      `Agendo.conflicts({ by: 'resource'${s.conflictsBlock ? '' : ', block: false'} })`],
    s.ical && [Agendo.ical({ filename: 'agendo-demo.ics' }), "Agendo.ical({ filename: 'agendo-demo.ics' })"],
    s.timeProgress && [Agendo.timeProgress(), 'Agendo.timeProgress()'],
    s.dataModel && [Agendo.eventDataModel(DEMO_MODEL), `Agendo.eventDataModel({ fields: [ /* ${DEMO_MODEL.fields.length} fields */ ] })`],
    s.storage && [Agendo.restStorage({ url: 'api/events' }), "Agendo.restStorage({ url: '/api/events' })"]
  ].filter(Boolean).map(([plugin, code]) => Object.assign(plugin, { code }));
}

// Calendar options from the settings.
function toOptions(s) {
  return {
    theme: s.theme || null,
    colorScheme: s.colorScheme,
    views: s.views.length === ALL_VIEWS.length ? null : s.views,
    locale: s.locale || navigator.language,
    firstDayOfWeek: s.firstDayOfWeek,
    use24Hour: s.use24Hour,
    weekNumbers: s.weekNumbers,
    startHour: s.startHour,
    endHour: s.endHour,
    businessHours: { start: s.businessStart, end: s.businessEnd },
    slotsPerHour: s.slotsPerHour,
    slotHeight: s.slotHeight,
    showCurrentTime: s.showCurrentTime,
    allDaySlot: s.allDaySlot,
    monthMaxEvents: s.monthMaxEvents,
    resources: s.resources ? RESOURCES : [],
    timelineCustom: s.timelineCustom ? TIMELINE_CUSTOM : null,
    calendars: s.filters ? CALENDARS : [],
    categories: s.filters ? CATEGORIES : [],
    readonly: s.readonly,
    enableCreate: s.enableCreate,
    enableMove: s.enableMove,
    enableResize: s.enableResize,
    openEventOn: s.openEventOn,
    eventPopover: s.eventPopover,
    enableAllDay: s.enableAllDay,
    enableRecurring: s.enableRecurring,
    plugins: pluginsOf(s)
  };
}

// --- Calendar ---

let calendar, builtWithStorage = null;

function buildCalendar() {
  // Carry the current state over to the new calendar.
  const prev = calendar && {
    date: calendar.date,
    view: calendar.o.daysToShow,
    events: calendar.getEvents(),
    filter: calendar.getFilter(),
    calendars: calendar.getCalendars().map(c => c.id),
    categories: calendar.getCategories().map(c => c.id)
  };
  calendar?.destroy();
  // Database storage on or off: the events come from the database, or back from the samples.
  const storageChanged = builtWithStorage !== null && builtWithStorage !== settings.storage;
  if (prev && storageChanged) prev.events = [];

  const opts = toOptions(settings);
  // Items unticked in the Filter menu stay unticked.
  const keepHidden = (list, known, shown) => list.map(x =>
    ({ ...x, visible: !known?.includes(x.id) || shown.includes(x.id) }));
  if (prev) {
    opts.calendars = keepHidden(opts.calendars, prev.calendars, prev.filter.calendars);
    opts.categories = keepHidden(opts.categories, prev.categories, prev.filter.categories);
  }

  calendar = new Agendo('#calendar-container', {
    ...opts,
    date: prev?.date ?? new Date(),
    daysToShow: prev?.view ?? 7,
    events: prev?.events ?? [],
    onFilterChange: f => logAction(`Filter: ${[...f.calendars, ...f.categories].join(', ') || 'nothing'} shown`),
    onEventChange: (ev, action, info) => logAction(`${action}${info ? ` (${info.scope})` : ''}: "${ev.title}" ${fmt(ev.start)} – ${fmt(ev.end)}`),
    onEventCreate: (ev, info) => logAction(`Created "${ev.title}"${info ? ` (${info.scope})` : ''}`),
    onEventDelete: (id, info) => logAction(`Deleted event ${id}${info ? ` (${info.scope})` : ''}`)
  });
  showCode(opts);
  renderBgList();
  watchRenders();
  if (storageChanged && !settings.storage) loadSample();
  builtWithStorage = settings.storage;
  showStorageStatus();
}

// The restStorage plugin when "Database storage" is on.
const storage = () => calendar.getPlugin('restStorage');

function showStorageStatus() {
  const el = document.getElementById('storage-status');
  if (!storage()) {
    el.innerHTML = 'Needs the Node.js server: <code>node server/server.js</code>';
    return;
  }
  el.textContent = 'Connecting…';
  storage().health()
    .then(h => { el.textContent = `Connected: ${h.storage === 'sqlite' ? 'SQLite database' : 'JSON file'} · ${num(h.events)} events stored`; })
    .catch(() => { el.innerHTML = 'Server not reachable: start it with <code>node server/server.js</code> and open its address'; });
}

// --- Themes: load the CSS framework from the CDN ---
// The page's own light colour mode is pinned so a dark OS setting does not flip Bulma.
const FRAMEWORKS = {
  tabler: ['https://cdn.jsdelivr.net/npm/@tabler/core@1.7.5/dist/css/tabler.min.css',
    'sha384-BY4EnLpEeqBnDZno/u4SjmwHqbv1/U9as69Q0Jk/zeaDJ8iV10NK7FP+6fFEGW4i'],
  bootstrap: ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/css/bootstrap.min.css',
    'sha384-yEPZ7jP9S0QKiUQ0m3jjsO4ProIW7wvR9gXkI7JOGa2XVsw53Yke2bsdkBbjmmiX'],
  bulma: ['https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css',
    'sha384-DCY3M8xLkMu6c9IKcKbe+jHKMjelnwC0p+SBaxfHxoBYZWdJF2X400UdBCgATtAB']
};

function loadFramework(name) {
  const link = document.getElementById('framework-css'), fw = FRAMEWORKS[name];
  if (fw) { link.integrity = fw[1]; link.href = fw[0]; } else { link.integrity = ''; link.removeAttribute('href'); }
}

// --- Customize sidebar ---

const panel = document.getElementById('customize');
const form = document.getElementById('customize-form');
const toggleBtn = document.getElementById('customize-btn');

function setPanel(open) {
  panel.classList.toggle('is-open', open);
  panel.inert = !open;
  toggleBtn.setAttribute('aria-expanded', open);
  if (open) panel.querySelector('[data-close]').focus();
  else if (panel.contains(document.activeElement) || document.activeElement === document.body) toggleBtn.focus();
}

toggleBtn.addEventListener('click', () => setPanel(!panel.classList.contains('is-open')));
panel.querySelector('[data-close]').addEventListener('click', () => setPanel(false));
panel.addEventListener('keydown', e => {
  // Escape inside an open calendar dialog or menu is theirs; here it only closes the sidebar.
  if (e.key === 'Escape') { e.preventDefault(); setPanel(false); }
});

// Settings → form controls.
function fillForm(s) {
  for (const el of form.elements) {
    if (!el.name || !(el.name in s)) continue;
    const v = s[el.name];
    if (el.type === 'checkbox') el.checked = Array.isArray(v) ? v.includes(el.value) : !!v;
    else if (el.type === 'radio') el.checked = el.value === String(v);
    else el.value = v;
  }
  form.elements.slotHeightOut.value = `${s.slotHeight}px`;
  syncEditing();
}

// Form controls → settings, with the hours kept in range.
function readForm() {
  const f = form.elements, num = (name, min, max) => Math.min(max, Math.max(min, Math.round(+f[name].value || 0)));
  const s = {
    theme: f.theme.value,
    colorScheme: f.colorScheme.value,
    views: [...form.querySelectorAll('[name="views"]:checked')].map(b => b.value),
    locale: f.locale.value,
    firstDayOfWeek: +f.firstDayOfWeek.value,
    use24Hour: f.use24Hour.checked,
    weekNumbers: f.weekNumbers.checked,
    startHour: num('startHour', 0, 23),
    endHour: num('endHour', 1, 24),
    businessStart: num('businessStart', 0, 23),
    businessEnd: num('businessEnd', 1, 24),
    slotsPerHour: +f.slotsPerHour.value,
    slotHeight: +f.slotHeight.value,
    showCurrentTime: f.showCurrentTime.checked,
    allDaySlot: f.allDaySlot.checked,
    monthMaxEvents: num('monthMaxEvents', 1, 10),
    resources: f.resources.checked,
    timelineCustom: f.timelineCustom.checked,
    filters: f.filters.checked,
    readonly: f.readonly.checked,
    enableCreate: f.enableCreate.checked,
    enableMove: f.enableMove.checked,
    enableResize: f.enableResize.checked,
    openEventOn: f.openEventOn.value,
    eventPopover: f.eventPopover.checked,
    enableAllDay: f.enableAllDay.checked,
    enableRecurring: f.enableRecurring.checked,
    holidays: f.holidays.value,
    holidaysDisplay: f.holidaysDisplay.value,
    conflicts: f.conflicts.checked,
    conflictsBlock: f.conflictsBlock.checked,
    ical: f.ical.checked,
    timeProgress: f.timeProgress.checked,
    dataModel: f.dataModel.checked,
    storage: f.storage.checked
  };
  if (s.endHour <= s.startHour) s.endHour = s.startHour + 1;
  if (s.businessEnd <= s.businessStart) s.businessEnd = Math.min(24, s.businessStart + 1);
  if (!s.views.length) s.views = ['week'];  // keep at least one view
  return s;
}

// Read-only turns the editing switches off; a plugin's own options follow the plugin.
function syncEditing() {
  const f = form.elements, ro = f.readonly.checked;
  for (const n of ['enableCreate', 'enableMove', 'enableResize', 'enableAllDay', 'enableRecurring']) f[n].disabled = ro;
  for (const r of form.querySelectorAll('[name="holidaysDisplay"]')) r.disabled = !f.holidays.value;
  f.conflictsBlock.disabled = !f.conflicts.checked;
}

form.addEventListener('input', e => {
  if (e.target.name === 'slotHeight') form.elements.slotHeightOut.value = `${e.target.value}px`;
});

form.addEventListener('change', e => {
  const next = readForm();
  // Theme and colour scheme switch in place; any other option rebuilds the calendar.
  const inPlace = Object.keys(next).every(k =>
    k === 'theme' || k === 'colorScheme' || JSON.stringify(next[k]) === JSON.stringify(settings[k]));
  settings = next;
  saveSettings();
  fillForm(settings);  // shows any value that was corrected
  loadFramework(settings.theme);
  applyPageScheme();
  if (inPlace) {
    calendar.setTheme(settings.theme || null);
    calendar.setColorScheme(settings.colorScheme);
    showCode(toOptions(settings));
  } else buildCalendar();
});
form.addEventListener('submit', e => e.preventDefault());

panel.querySelector('[data-reset]').addEventListener('click', () => {
  settings = { ...DEFAULTS };
  saveSettings();
  fillForm(settings);
  loadFramework(settings.theme);
  applyPageScheme();
  buildCalendar();
  logAction('Options reset to defaults');
});

// The options that differ from Agendo.defaults, as code to paste.
function showCode(opts) {
  const lines = [];
  for (const [k, v] of Object.entries(opts)) {
    if (JSON.stringify(v) === JSON.stringify(Agendo.defaults[k])) continue;
    if (k === 'locale' && !settings.locale) continue;
    if (k === 'plugins') { lines.push(`  plugins: [\n    ${v.map(p => p.code).join(',\n    ')}\n  ]`); continue; }
    const val = Array.isArray(v) && v.length && typeof v[0] === 'object'
      ? `[ /* ${v.length} ${k} */ ]`
      : JSON.stringify(v).replace(/"(\w+)":/g, '$1: ').replace(/"/g, "'").replace(/,/g, ', ');
    lines.push(`  ${k}: ${val}`);
  }
  document.getElementById('customize-code').textContent =
    `new Agendo('#calendar', {\n${lines.join(',\n')}\n});`;
}

panel.querySelector('[data-copy]').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById('customize-code').textContent);
    logAction('Options copied');
  } catch { logAction('Copy not available here'); }
});

// --- Background events: list, add, edit, delete (public API: addEvent / updateEvent / deleteEvent) ---
// They cannot be clicked in the calendar (clicks go through them), so the sidebar manages them.

const bgList = document.getElementById('bg-list');
const bgDialog = document.getElementById('bg-dialog');
const bgForm = document.getElementById('bg-form');
const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const isBgEvent = ev => ev.display === 'background' || ev.display === 'inverse-background';
const pad = n => String(n).padStart(2, '0');
const dayValue = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateTimeValue = d => `${dayValue(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const readDate = el => (el.type === 'date' ? new Date(`${el.value}T00:00`) : new Date(el.value));
let bgEditing = null;

// Which repeat choice a rule is ('keep' when it is none of them).
function repeatKind(r, start) {
  if (!r) return 'none';
  if (r.interval > 1 || r.until || r.count) return 'keep';
  const by = (r.byDay ?? []).join(',');
  if (r.freq === 'daily' && !by) return 'daily';
  if (r.freq === 'weekly' && by === 'MO,TU,WE,TH,FR') return 'weekdays';
  if (r.freq === 'weekly' && (!by || by === WEEKDAY_CODES[start.getDay()])) return 'weekly';
  return 'keep';
}

function repeatRule(kind, start) {
  switch (kind) {
    case 'daily': return { freq: 'daily' };
    case 'weekdays': return { freq: 'weekly', byDay: ['MO', 'TU', 'WE', 'TH', 'FR'] };
    case 'weekly': return { freq: 'weekly', byDay: [WEEKDAY_CODES[start.getDay()]] };
  }
  return null;
}

function bgWhen(ev) {
  const time = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const day = d => d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  const kind = repeatKind(ev.recurrence, ev.start);
  const when = { none: day(ev.start), daily: 'Every day', weekdays: 'Weekdays',
    weekly: `Every ${ev.start.toLocaleDateString([], { weekday: 'long' })}`, keep: `Repeats from ${day(ev.start)}` }[kind];
  const hours = ev.allDay ? 'all day' : `${time(ev.start)}–${time(ev.end)}`;
  const res = RESOURCES.find(r => r.id === ev.resourceId);
  return `${when}, ${hours}${res ? ` · ${res.title}` : ''}${ev.display === 'inverse-background' ? ' · outside' : ''}`;
}

function renderBgList() {
  const items = calendar.getEvents().filter(isBgEvent).sort((a, b) => a.start - b.start);
  if (!items.length) {
    bgList.replaceChildren(Object.assign(document.createElement('li'), { className: 'bg-empty', textContent: 'None yet.' }));
    return;
  }
  bgList.replaceChildren(...items.map(ev => {
    const li = document.createElement('li');
    const swatch = Object.assign(document.createElement('span'), { className: 'bg-swatch' });
    swatch.style.setProperty('--c', ev.color || '#8fdf82');
    const text = document.createElement('div');
    text.append(
      Object.assign(document.createElement('div'), { className: 'bg-name', textContent: ev.title || '(no title)' }),
      Object.assign(document.createElement('div'), { className: 'bg-when', textContent: bgWhen(ev) }));
    const btn = (label, action) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'demo-btn small', textContent: label });
      b.dataset[action] = ev.id;
      b.setAttribute('aria-label', `${label} ${ev.title || 'background event'}`);
      return b;
    };
    li.append(swatch, text, btn('Edit', 'edit'), btn('Delete', 'delete'));
    return li;
  }));
}

function setBgDates(allDay, start, end) {
  const f = bgForm.elements;
  f.start.type = f.end.type = allDay ? 'date' : 'datetime-local';
  const last = new Date(end);
  last.setDate(last.getDate() - 1);   // all-day ends are exclusive; the form shows the last day
  f.start.value = allDay ? dayValue(start) : dateTimeValue(start);
  f.end.value = allDay ? dayValue(last < start ? start : last) : dateTimeValue(end);
}

function openBgDialog(ev) {
  bgEditing = ev;
  const f = bgForm.elements;
  const start = ev?.start ?? (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; })();
  const end = ev?.end ?? new Date(+start + 36e5);
  f.title.value = ev?.title ?? '';
  f.display.value = ev?.display ?? 'background';
  f.color.value = ev?.color ?? '#94a3b8';
  f.allDay.checked = !!ev?.allDay;
  setBgDates(f.allDay.checked, start, end);
  f.resourceId.replaceChildren(new Option('All resources', ''), ...RESOURCES.map(r => new Option(r.title, r.id)));
  f.resourceId.value = ev?.resourceId ?? '';
  const kind = repeatKind(ev?.recurrence, start);
  f.repeat.querySelector('[value="keep"]').hidden = kind !== 'keep';
  f.repeat.value = kind;
  bgForm.querySelector('[value="delete"]').hidden = !ev;
  document.getElementById('bg-dialog-title').textContent = ev ? 'Edit background event' : 'New background event';
  bgDialog.showModal();
}

bgForm.elements.allDay.addEventListener('change', () => {
  const f = bgForm.elements, s = readDate(f.start), e = readDate(f.end);
  if (f.allDay.checked) {
    const end = new Date(e < s ? s : e);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    setBgDates(true, s, end);
  } else {
    const start = new Date(s), last = new Date(e);
    start.setHours(12, 0, 0, 0);
    last.setHours(13, 0, 0, 0);
    setBgDates(false, start, last < start ? new Date(+start + 36e5) : last);
  }
});

bgForm.addEventListener('submit', e => {
  const f = bgForm.elements, action = e.submitter?.value;
  if (action === 'delete' && bgEditing) {
    calendar.deleteEvent(bgEditing.id);
    storage()?.remove(bgEditing.id);
    logAction(`Deleted background event "${bgEditing.title}"`);
  } else if (action === 'save') {
    const allDay = f.allDay.checked, start = readDate(f.start);
    let end = readDate(f.end);
    if (allDay) end.setDate(end.getDate() + 1);
    if (!(end > start)) end = allDay ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) : new Date(+start + 36e5);
    const data = {
      title: f.title.value.trim(), display: f.display.value, color: f.color.value, allDay, start, end,
      resourceId: f.resourceId.value || undefined,
      recurrence: f.repeat.value === 'keep' ? bgEditing?.recurrence : repeatRule(f.repeat.value, start)
    };
    if (bgEditing) {
      calendar.updateEvent(bgEditing.id, data);
      storage()?.save(calendar.getEvents().find(x => x.id === bgEditing.id));
      logAction(`Updated background event "${data.title}"`);
    } else {
      storage()?.save(calendar.addEvent({ id: `bg-${Date.now()}`, ...data }));
      logAction(`Added background event "${data.title}"`);
    }
  }
  renderBgList();
});

document.getElementById('bg-add').addEventListener('click', () => openBgDialog(null));
bgList.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const ev = calendar.getEvents().find(x => x.id === (btn.dataset.edit ?? btn.dataset.delete));
  if (!ev) return;
  if (btn.dataset.edit) return openBgDialog(ev);
  calendar.deleteEvent(ev.id);
  storage()?.remove(ev.id);
  logAction(`Deleted background event "${ev.title}"`);
  renderBgList();
});

// --- Performance: time of every render, load tests, benchmark of every view ---

const perfLine = document.getElementById('perf');
const perfResults = document.getElementById('perf-results');
const num = n => n.toLocaleString('en-US');
const ms = t => `${t < 10 ? t.toFixed(1) : Math.round(t)} ms`;
const nextPaint = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
const VIEW_NAMES = {
  1: 'Day', 5: 'Workweek', 7: 'Week', month: 'Month', year: 'Year',
  'list-day': 'List day', 'list-week': 'List week', 'list-month': 'List month',
  'resource-day': 'Resources day', 'resource-workweek': 'Resources workweek', 'resource-week': 'Resources week',
  'timeline-day': 'Timeline day', 'timeline-week': 'Timeline week', 'timeline-month': 'Timeline month', 'timeline-custom': 'Timeline 3 days'
};
let benchmarking = false, renderCount = 0;

// Events the view on screen works on (overlapping its dates; internal, for the demo only).
const inRange = () => calendar._occurrences().length;

// Every render (view change, previous / next, today…): time to build it, and until it is painted.
function watchRenders() {
  const render = calendar.render.bind(calendar);
  calendar.render = () => {
    const t0 = performance.now();
    render();
    const built = performance.now() - t0;
    if (benchmarking) return;
    const view = VIEW_NAMES[calendar.o.daysToShow] ?? calendar.o.daysToShow;
    const id = ++renderCount;
    perfLine.textContent = `⏱ ${view} · render ${ms(built)} · ${num(calendar.getEvents().length)} events loaded · ${num(inRange())} in range`;
    // Only the latest render reports its paint (two renders in a row would both append).
    nextPaint().then(() => { if (id === renderCount) perfLine.textContent += ` · painted ${ms(performance.now() - t0)}`; });
  };
}

function showResults(title, rows, head) {
  const table = document.createElement('table');
  table.className = 'perf-table';
  const tr = (cells, tag = 'td') => {
    const row = document.createElement('tr');
    for (const c of cells) row.append(Object.assign(document.createElement(tag), { textContent: c }));
    return row;
  };
  if (head) table.createTHead().append(tr(head, 'th'));
  const body = table.createTBody();
  rows.forEach(r => body.append(tr(r)));
  perfResults.replaceChildren(Object.assign(document.createElement('div'), { className: 'perf-title', textContent: title }), table);
}

// Centre the calendar on the loaded events.
function gotoMiddle() {
  let min = Infinity, max = -Infinity;
  for (const ev of calendar.getEvents()) { const t = +ev.start; if (t < min) min = t; if (t > max) max = t; }
  if (min <= max) calendar.gotoDate(new Date((min + max) / 2));
}

async function loadTest() {
  const n = +document.getElementById('perf-count').value, days = +document.getElementById('perf-days').value;
  const rows = [];
  perfResults.textContent = `Generating ${num(n)} events…`;
  await nextPaint();
  const t0 = performance.now();
  let events = generateEvents(n, { days });
  rows.push([`Generate ${num(n)} events`, ms(performance.now() - t0)]);
  const t2 = performance.now();
  calendar.setEvents(events);
  rows.push(['setEvents (normalize + render)', ms(performance.now() - t2)]);
  events = null;
  const t3 = performance.now();
  gotoMiddle();
  rows.push([`Render ${VIEW_NAMES[calendar.o.daysToShow] ?? 'view'} (${num(inRange())} in range)`, ms(performance.now() - t3)]);
  await nextPaint();
  rows.push(['Total, until painted', ms(performance.now() - t0)]);
  showResults(`${num(n)} events generated over ${days} days`, rows);
  renderBgList();
  logAction(`Loaded ${num(n)} events`);
}

// Each view in turn: build time, time until painted, events in range.
async function benchmark() {
  const view = calendar.o.daysToShow, date = new Date(calendar.date);
  const hasRes = calendar.getResources().length > 0;
  const views = Object.keys(VIEW_NAMES).map(v => (isNaN(v) ? v : +v))
    .filter(v => hasRes || !/^(resource|timeline)-/.test(v))
    .filter(v => v !== 'timeline-custom' || settings.timelineCustom);
  const rows = [];
  benchmarking = true;
  perfResults.textContent = 'Running…';
  await nextPaint();
  try {
    for (const v of views) {
      const t0 = performance.now();
      calendar.setView(v);
      const built = performance.now() - t0;
      await nextPaint();
      rows.push([VIEW_NAMES[v], ms(built), ms(performance.now() - t0), num(inRange())]);
    }
  } finally {
    benchmarking = false;
  }
  calendar.date = date;
  calendar.setView(view);
  showResults(`${num(calendar.getEvents().length)} events loaded`, rows, ['View', 'Render', 'Painted', 'In range']);
}

document.getElementById('perf-load').addEventListener('click', loadTest);
document.getElementById('perf-bench').addEventListener('click', benchmark);
document.getElementById('perf-restore').addEventListener('click', () => {
  // With database storage on, "restore" reloads the database's events.
  const done = () => { calendar.today(); renderBgList(); perfResults.textContent = ''; logAction('Demo data restored'); };
  if (storage()) { storage().reload(); done(); } else loadSample().then(done);
});
// These controls are not calendar options: keep them out of the settings form.
document.getElementById('perf-test').addEventListener('change', e => e.stopPropagation());

// --- Dark / light ---
// The page follows the same scheme as the calendar. data-theme and data-bs-theme on <html> also
// switch the loaded framework (Bulma, Tabler, Bootstrap) and the demo's own colours.

const darkOS = matchMedia('(prefers-color-scheme: dark)');
const schemeBtn = document.getElementById('scheme-btn');
const resolvedScheme = () => settings.colorScheme === 'auto' ? (darkOS.matches ? 'dark' : 'light') : settings.colorScheme;

function applyPageScheme() {
  const mode = resolvedScheme(), root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.bsTheme = mode;
  const label = `Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`;
  schemeBtn.setAttribute('aria-label', label);
  schemeBtn.title = label;
}

darkOS.addEventListener('change', () => { if (settings.colorScheme === 'auto') applyPageScheme(); });

// The button picks the opposite of what is shown (leaving Auto); the sidebar can set Auto again.
schemeBtn.addEventListener('click', () => {
  settings = { ...settings, colorScheme: resolvedScheme() === 'dark' ? 'light' : 'dark' };
  saveSettings();
  fillForm(settings);
  applyPageScheme();
  calendar.setColorScheme(settings.colorScheme);
  showCode(toOptions(settings));
});

// --- Start ---

fillForm(settings);
applyPageScheme();
loadFramework(settings.theme);
buildCalendar();

// The sample data is for one fixed week; shift it to the current week.
// Recurring events shift too; their rules (weekdays, last Friday…) apply from the new start.
function shiftToThisWeek(events) {
  // 'YYYY-MM-DD' is a local date (new Date() would read it as UTC midnight).
  const parse = s => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00`) : new Date(s));
  const monday = s => { const d = parse(s); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; };
  const days = Math.round((monday(new Date()) - monday(events[0].start)) / 864e5);
  const shift = s => { if (s == null) return s; const d = parse(s); d.setDate(d.getDate() + days); return d; };
  return events.map(e => ({ ...e, start: shift(e.start), end: shift(e.end) }));
}

// The sample events (with database storage on, the events come from the database instead).
function loadSample() {
  return fetch('events.json')
    .then(r => r.json())
    .then(data => { calendar.setEvents(shiftToThisWeek(data)); renderBgList(); })
    .catch(err => console.warn('Could not load events.json (serve over HTTP):', err));
}
if (!settings.storage) loadSample();

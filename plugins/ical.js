/* Agendo plugin: ical — import and export iCalendar (.ics) files (RFC 5545).
 *
 *   <script src="plugins/ical.js"></script>
 *   new Agendo('#calendar', { plugins: [Agendo.ical({ filename: 'agenda.ics' })] });
 *
 * Adds export and import icon buttons to the toolbar (toolbar hook; label on hover and focus), and an API:
 *   const ical = calendar.getPlugin('ical');
 *   ical.toICS(events?)  → the .ics text (default: calendar.getEvents())
 *   ical.parse(text)     → Agendo events
 *   ical.download()      ical.import(text) → number of events added
 *
 * Export: title, start / end (all-day as DATE, timed as local time), location, description,
 * recurrence as RRULE + EXDATE, category, and Agendo fields (resource, calendar, colour, display)
 * as X-AGENDO-* properties, so a round trip keeps them. Events from plugin sources (holidays)
 * are not part of the data and are not exported.
 * Import: VEVENTs with DTSTART / DTEND or DURATION, all-day dates, UTC times (…Z), RRULE, EXDATE,
 * SUMMARY, LOCATION, DESCRIPTION, UID and the X-AGENDO-* properties. Times with a TZID are read
 * as local times.
 */
(function () {
  const pad = n => String(n).padStart(2, '0');
  const date = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const local = d => `${date(d)}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const utc = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const text = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const untext = s => s.replace(/\\(n|N|,|;|\\)/g, (_, c) => (c === 'n' || c === 'N' ? '\n' : c));

  // Lines of at most 75 octets, continued with a space (RFC 5545 §3.1).
  function fold(line) {
    const bytes = new TextEncoder().encode(line);
    if (bytes.length <= 75) return line;
    const out = [];
    let cur = '', size = 0;
    for (const ch of line) {
      const n = new TextEncoder().encode(ch).length;
      if (size + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; size = 0; }
      cur += ch;
      size += n;
    }
    out.push(cur);
    return out.join('\r\n ');
  }

  // 20261116 → local midnight; 20261116T090000 → local; …Z → UTC.
  function readDate(value, params) {
    const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
    if (!m) return null;
    const [, y, mo, d, h, mi, s, z] = m;
    if (!h) return { date: new Date(+y, mo - 1, +d), allDay: true };
    const dt = z ? new Date(Date.UTC(+y, mo - 1, +d, +h, +mi, +(s || 0))) : new Date(+y, mo - 1, +d, +h, +mi, +(s || 0));
    return { date: dt, allDay: params.VALUE === 'DATE' };
  }

  // P1DT2H30M → milliseconds (weeks, days, hours, minutes, seconds).
  function duration(v) {
    const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v.trim());
    if (!m) return 0;
    const [, sign, w, d, h, mi, s] = m.map(x => x ?? 0);
    return (sign === '-' ? -1 : 1) * ((((+w * 7 + +d) * 24 + +h) * 60 + +mi) * 60 + +s) * 1000;
  }

  function ical({ filename = 'agendo.ics', exportButton = true, importButton = true, prodId = '-//Agendo//Agendo calendar//EN' } = {}) {
    let calendar;

    function toICS(events = calendar.getEvents()) {
      const cat = id => calendar.getCategories().find(c => c.id === id)?.title;
      const now = utc(new Date());
      const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${prodId}`, 'CALSCALE:GREGORIAN'];
      for (const ev of events) {
        const dt = d => (ev.allDay ? `;VALUE=DATE:${date(d)}` : `:${local(d)}`);
        lines.push('BEGIN:VEVENT', `UID:${ev.id}@agendo`, `DTSTAMP:${now}`, `DTSTART${dt(ev.start)}`, `DTEND${dt(ev.end)}`,
          `SUMMARY:${text(ev.title ?? '')}`);
        if (ev.location) lines.push(`LOCATION:${text(ev.location)}`);
        if (ev.description) lines.push(`DESCRIPTION:${text(ev.description)}`);
        if (cat(ev.categoryId)) lines.push(`CATEGORIES:${text(cat(ev.categoryId))}`);
        if (ev.recurrence) {
          lines.push(`RRULE:${Agendo.toRRule(ev.recurrence)}`);
          for (const k of ev.recurrence.exdates ?? []) {
            const [y, m, d] = k.split('-').map(Number), day = new Date(y, m - 1, d);
            if (ev.allDay) lines.push(`EXDATE;VALUE=DATE:${date(day)}`);
            else lines.push(`EXDATE:${local(new Date(y, m - 1, d, ev.start.getHours(), ev.start.getMinutes()))}`);
          }
        }
        if (ev.display === 'background' || ev.display === 'inverse-background') lines.push('TRANSP:TRANSPARENT', `X-AGENDO-DISPLAY:${ev.display}`);
        if (ev.resourceId) lines.push(`X-AGENDO-RESOURCE:${text(ev.resourceId)}`);
        if (ev.calendarId) lines.push(`X-AGENDO-CALENDAR:${text(ev.calendarId)}`);
        if (ev.categoryId) lines.push(`X-AGENDO-CATEGORY:${text(ev.categoryId)}`);
        if (ev.color) lines.push(`X-AGENDO-COLOR:${text(ev.color)}`);
        lines.push('END:VEVENT');
      }
      lines.push('END:VCALENDAR');
      return lines.map(fold).join('\r\n') + '\r\n';
    }

    function parse(ics) {
      const lines = String(ics).replace(/\r\n[ \t]|\n[ \t]/g, '').split(/\r?\n/);   // unfold
      const events = [];
      let cur = null;
      for (const line of lines) {
        if (line === 'BEGIN:VEVENT') { cur = { props: {}, exdates: [] }; continue; }
        if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; continue; }
        if (!cur) continue;
        const colon = line.search(/:(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (colon < 0) continue;
        const [name, ...rawParams] = line.slice(0, colon).split(';');
        const params = Object.fromEntries(rawParams.map(p => { const [k, v = ''] = p.split('='); return [k.toUpperCase(), v.replace(/"/g, '')]; }));
        const value = line.slice(colon + 1), key = name.toUpperCase();
        if (key === 'EXDATE') cur.exdates.push(...value.split(',').map(v => readDate(v, params)?.date).filter(Boolean));
        else cur.props[key] = { value, params };
      }

      const out = [];
      for (const { props, exdates } of events) {
        const start = props.DTSTART && readDate(props.DTSTART.value, props.DTSTART.params);
        if (!start) continue;
        let end = props.DTEND && readDate(props.DTEND.value, props.DTEND.params)?.date;
        if (!end && props.DURATION) end = new Date(+start.date + duration(props.DURATION.value));
        const x = k => props[`X-AGENDO-${k}`] && untext(props[`X-AGENDO-${k}`].value);
        const ev = {
          id: `ics-${(props.UID?.value ?? Math.random().toString(36).slice(2)).replace(/@agendo$/, '')}`,
          title: props.SUMMARY ? untext(props.SUMMARY.value) : '',
          allDay: start.allDay,
          start: start.date,
          end: end ?? undefined
        };
        if (props.LOCATION) ev.location = untext(props.LOCATION.value);
        if (props.DESCRIPTION) ev.description = untext(props.DESCRIPTION.value);
        for (const [k, f] of [['RESOURCE', 'resourceId'], ['CALENDAR', 'calendarId'], ['CATEGORY', 'categoryId'], ['COLOR', 'color'], ['DISPLAY', 'display']]) {
          if (x(k)) ev[f] = x(k);
        }
        if (props.RRULE) ev.recurrence = { ...Agendo.parseRRule(props.RRULE.value), exdates };
        out.push(ev);
      }
      return out;
    }

    // Adds the events of an .ics text (an event whose id is already there is replaced).
    function importText(ics) {
      const events = parse(ics), ids = new Set(events.map(e => e.id));
      calendar.setEvents([...calendar.getEvents().filter(e => !ids.has(e.id)), ...events]);
      calendar.notify(`Imported ${events.length} event${events.length === 1 ? '' : 's'}`);
      return events.length;
    }

    function download() {
      const events = calendar.getEvents();
      const url = URL.createObjectURL(new Blob([toICS(events)], { type: 'text/calendar;charset=utf-8' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      calendar.notify(`Exported ${events.length} event${events.length === 1 ? '' : 's'} to ${filename}`);
    }

    return {
      name: 'ical',
      install(cal) { calendar = cal; },
      toolbar(slot) {
        // Icon buttons (Tabler icons "download" / "upload"); the label shows on hover and focus (data-tip).
        const ICONS = {
          export: '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 11l5 5l5 -5"/><path d="M12 4l0 12"/>',
          import: '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 9l5 -5l5 5"/><path d="M12 4l0 12"/>'
        };
        const button = (icon, label, onClick) => {
          const b = Object.assign(document.createElement('button'), { type: 'button', className: 'ago-btn ago-icon-btn' });
          b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[icon]}</svg>`;
          b.dataset.tip = label;
          b.setAttribute('aria-label', label);
          b.addEventListener('click', onClick);
          return b;
        };
        if (exportButton) slot.append(button('export', 'Export to .ics', download));
        if (importButton) {
          const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.ics,text/calendar', hidden: true });
          input.addEventListener('change', async () => {
            const file = input.files[0];
            if (file) importText(await file.text());
            input.value = '';
          });
          slot.append(input, button('import', 'Import an .ics file', () => input.click()));
        }
      },
      toICS, parse, download, import: importText
    };
  }

  if (typeof Agendo !== 'undefined') Agendo.ical = ical;
  if (typeof window !== 'undefined') window.AgendoIcal = ical;
})();

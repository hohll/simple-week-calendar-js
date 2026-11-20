/* Agendo plugin: eventDataModel — the information an event holds, as a list of fields.
 *
 *   <script src="agendo.js"></script>
 *   <script src="plugins/event-data-model.js"></script>
 *
 *   new Agendo('#calendar', {
 *     plugins: [Agendo.eventDataModel({
 *       fields: [
 *         { name: 'location', label: 'Location', type: 'text', required: true },
 *         { name: 'priority', label: 'Priority', type: 'select', default: 'normal', badge: true, popover: true,
 *           options: [{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High', color: '#dc2626' }] },
 *         { name: 'attendees', label: 'Attendees', type: 'number', min: 1, max: 50, popover: true },
 *         { name: 'online', label: 'Online meeting', type: 'checkbox', badge: 'Online' },
 *         { name: 'notes', label: 'Notes', type: 'textarea', popover: true }
 *       ],
 *       hide: ['category'],                                  // core fields left out of the form
 *       order: ['title', 'location', 'start', 'end']         // these first, the others after, in their order
 *     })]
 *   });
 *
 * Field: { name, label, type, default, required, min, max, step, pattern, placeholder, maxLength, rows,
 *          help, options (select: values or { value, label, color }), validate(value, data) → message,
 *          badge (true: the value; a string: that text; a function (value, event) → text or null;
 *                 select options add their colour),
 *          popover (show in the hover card) }
 * Types: text, textarea, number, select, checkbox, date, time, url, email, color.
 *
 * What it does:
 *   normalizeEvent  values get their type (numbers, booleans, select values from the list), defaults
 *                   fill missing values, so loaded data, saved events and callbacks agree;
 *   formFields      adds the fields to the event form, hides and orders the core ones;
 *   validate        each field's validate(value, data) (required / min / max / pattern are checked
 *                   by the browser);
 *   eventContent    badges on the events;
 *   popoverContent  rows in the hover card.
 * Plugin API: calendar.getPlugin('eventDataModel').fields
 */
(function () {
  const TYPES = ['text', 'textarea', 'number', 'select', 'checkbox', 'date', 'time', 'url', 'email', 'color'];
  const CORE_POPOVER = ['location', 'description'];   // the core popover already shows these

  const optionOf = (field, value) => (field.options ?? [])
    .map(o => (typeof o === 'object' ? o : { value: o, label: o }))
    .find(o => String(o.value) === String(value));

  // A value of the field's type, or undefined.
  function coerce(field, v) {
    if (v === undefined || v === null || v === '') return undefined;
    switch (field.type) {
      case 'number': { const n = Number(v); return Number.isFinite(n) ? n : undefined; }
      case 'checkbox': return v === true || v === 'true' || v === 1 || v === '1' || v === 'on';
      case 'select': return optionOf(field, v) ? optionOf(field, v).value : undefined;
      case 'date': {
        if (!(v instanceof Date)) return String(v);
        const p = n => String(n).padStart(2, '0');
        return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
      }
      default: return String(v);
    }
  }

  // Text shown for a value (badge, popover).
  function display(field, v, locale) {
    if (field.type === 'checkbox') return v ? 'Yes' : 'No';
    if (field.type === 'select') return optionOf(field, v)?.label ?? String(v);
    if (field.type === 'date') {
      const d = new Date(`${v}T00:00`);
      return isNaN(d) ? String(v) : d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return String(v);
  }

  function eventDataModel({ fields = [], hide = [], order = null } = {}) {
    for (const f of fields) {
      if (!f.name) throw new Error('eventDataModel: every field needs a name');
      if (f.type && !TYPES.includes(f.type)) throw new Error(`eventDataModel: unknown type "${f.type}" for "${f.name}"`);
    }
    let calendar;

    return {
      name: 'eventDataModel',
      fields,

      install(cal) { calendar = cal; },

      normalizeEvent(ev) {
        for (const f of fields) {
          const v = coerce(f, ev[f.name]);
          if (v !== undefined) ev[f.name] = v;
          else if (f.default !== undefined && f.type !== 'checkbox') ev[f.name] = typeof f.default === 'function' ? f.default(ev) : f.default;
          else if (f.type === 'checkbox') ev[f.name] = !!f.default;
          else delete ev[f.name];
        }
        return ev;
      },

      formFields(list) {
        const out = list.filter(f => !hide.includes(f.name)).concat(fields.map(f => ({ ...f, type: f.type ?? 'text' })));
        if (!order) return out;
        const rank = f => { const i = order.indexOf(f.name); return i < 0 ? order.length : i; };
        return out.map((f, i) => ({ f, i })).sort((a, b) => rank(a.f) - rank(b.f) || a.i - b.i).map(x => x.f);
      },

      validate(data) {
        const errors = {};
        for (const f of fields) {
          const msg = f.validate?.(data[f.name], data);
          if (msg) errors[f.name] = msg;
        }
        return errors;
      },

      eventContent(ev, el, view) {
        const host = el.querySelector('.ago-event-title, .ago-mevent-title, .ago-list-title');
        if (!host) return;
        for (const f of fields) {
          const v = ev[f.name];
          if (!f.badge || v === undefined || v === false || v === '') continue;
          const text = typeof f.badge === 'function' ? f.badge(v, ev)
            : typeof f.badge === 'string' ? f.badge : display(f, v, calendar?.o.locale);
          if (!text) continue;
          const badge = Object.assign(document.createElement('span'), { className: 'ago-badge', textContent: text });
          const color = f.type === 'select' && optionOf(f, v)?.color;
          if (color) badge.style.setProperty('--ago-badge', color);
          badge.dataset.field = f.name;
          host.append(badge);
        }
      },

      popoverContent(parts, ev) {
        const rows = [];
        for (const f of fields) {
          const v = ev[f.name];
          if (!f.popover || CORE_POPOVER.includes(f.name) || v === undefined || v === '') continue;
          rows.push(Object.assign(document.createElement('dt'), { textContent: f.label ?? f.name }),
            Object.assign(document.createElement('dd'), { textContent: display(f, v, calendar?.o.locale) }));
        }
        if (!rows.length) return parts;
        let dl = parts.find(p => p.tagName === 'DL');
        if (!dl) {
          dl = document.createElement('dl');
          const desc = parts.findIndex(p => p.classList?.contains('ago-pop-desc'));
          parts.splice(desc < 0 ? parts.length : desc, 0, dl);
        }
        dl.append(...rows);
        return parts;
      }
    };
  }

  if (typeof Agendo !== 'undefined') Agendo.eventDataModel = eventDataModel;
  if (typeof window !== 'undefined') window.AgendoEventDataModel = eventDataModel;
})();

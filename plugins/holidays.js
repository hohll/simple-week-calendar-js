/* Agendo plugin: holidays — public holidays as all-day events, computed for the dates on screen.
 *
 *   <script src="plugins/holidays.js"></script>
 *   new Agendo('#calendar', { plugins: [Agendo.holidays({ country: 'FR' })] });
 *
 * Options:
 *   country   'FR' | 'DE' | 'GB' | 'US' (national holidays; GB = England and Wales, without substitute days)
 *   display   'background' (default: shaded days) | 'auto' (all-day events, not editable)
 *   color     colour of the shade or the events (default '#f59e0b')
 *   extra     [{ date: 'MM-DD', title }] more fixed holidays (company days…)
 *
 * Holidays come from the eventSource hook: computed for any year you go to, they are not part of
 * the calendar's data (not in getEvents(), not exported, not saved). Easter-based ones (Good Friday,
 * Easter Monday, Ascension, Whit Monday) use the Gregorian computus.
 */
(function () {
  // Easter Sunday (anonymous Gregorian algorithm).
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }
  const plus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  // n-th weekday (0 = Sunday) of a month; n = -1 for the last one.
  function nth(y, month, weekday, n) {
    if (n > 0) {
      const first = new Date(y, month, 1);
      return new Date(y, month, 1 + ((weekday - first.getDay() + 7) % 7) + (n - 1) * 7);
    }
    const last = new Date(y, month + 1, 0);
    return new Date(y, month, last.getDate() - ((last.getDay() - weekday + 7) % 7));
  }
  const on = (y, m, d) => new Date(y, m - 1, d);

  const COUNTRIES = {
    FR: y => {
      const e = easter(y);
      return [[on(y, 1, 1), "Jour de l'an"], [plus(e, 1), 'Lundi de Pâques'], [on(y, 5, 1), 'Fête du Travail'],
        [on(y, 5, 8), 'Victoire 1945'], [plus(e, 39), 'Ascension'], [plus(e, 50), 'Lundi de Pentecôte'],
        [on(y, 7, 14), 'Fête nationale'], [on(y, 8, 15), 'Assomption'], [on(y, 11, 1), 'Toussaint'],
        [on(y, 11, 11), 'Armistice'], [on(y, 12, 25), 'Noël']];
    },
    DE: y => {
      const e = easter(y);
      return [[on(y, 1, 1), 'Neujahr'], [plus(e, -2), 'Karfreitag'], [plus(e, 1), 'Ostermontag'],
        [on(y, 5, 1), 'Tag der Arbeit'], [plus(e, 39), 'Christi Himmelfahrt'], [plus(e, 50), 'Pfingstmontag'],
        [on(y, 10, 3), 'Tag der Deutschen Einheit'], [on(y, 12, 25), '1. Weihnachtstag'], [on(y, 12, 26), '2. Weihnachtstag']];
    },
    GB: y => {
      const e = easter(y);
      return [[on(y, 1, 1), "New Year's Day"], [plus(e, -2), 'Good Friday'], [plus(e, 1), 'Easter Monday'],
        [nth(y, 4, 1, 1), 'Early May bank holiday'], [nth(y, 4, 1, -1), 'Spring bank holiday'],
        [nth(y, 7, 1, -1), 'Summer bank holiday'], [on(y, 12, 25), 'Christmas Day'], [on(y, 12, 26), 'Boxing Day']];
    },
    US: y => [[on(y, 1, 1), "New Year's Day"], [nth(y, 0, 1, 3), 'Martin Luther King Jr. Day'],
      [nth(y, 1, 1, 3), "Presidents' Day"], [nth(y, 4, 1, -1), 'Memorial Day'], [on(y, 6, 19), 'Juneteenth'],
      [on(y, 7, 4), 'Independence Day'], [nth(y, 8, 1, 1), 'Labor Day'], [nth(y, 9, 1, 2), 'Columbus Day'],
      [on(y, 11, 11), 'Veterans Day'], [nth(y, 10, 4, 4), 'Thanksgiving'], [on(y, 12, 25), 'Christmas Day']]
  };

  function holidays({ country = 'FR', display = 'background', color = '#f59e0b', extra = [] } = {}) {
    const rule = COUNTRIES[country];
    if (!rule) throw new Error(`holidays: unknown country "${country}" (${Object.keys(COUNTRIES).join(', ')})`);
    const cache = new Map();
    const pad = n => String(n).padStart(2, '0');
    const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    function ofYear(y) {
      if (!cache.has(y)) {
        const list = rule(y).concat(extra.map(x => { const [m, d] = x.date.split('-').map(Number); return [on(y, m, d), x.title]; }));
        cache.set(y, list.map(([date, title]) => ({
          id: `holiday-${country}-${key(date)}`, title, allDay: true, start: date, end: plus(date, 1),
          display: display === 'background' ? 'background' : undefined, color, editable: false, holiday: true
        })));
      }
      return cache.get(y);
    }

    return {
      name: 'holidays',
      country,
      eventSource(from, to) {
        const out = [];
        for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
          for (const h of ofYear(y)) if (h.start < to && h.end > from) out.push(h);
        }
        return out;
      },
      // The list for a year, for your own use: calendar.getPlugin('holidays').list(2027)
      list: y => ofYear(y).map(h => ({ date: key(h.start), title: h.title }))
    };
  }

  holidays.countries = Object.keys(COUNTRIES);
  if (typeof Agendo !== 'undefined') Agendo.holidays = holidays;
  if (typeof window !== 'undefined') window.AgendoHolidays = holidays;
})();

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
    <img src="assets/logo.svg" alt="Agendo" width="320">
  </picture>
</p>

# Agendo

**Agendo** is a lightweight calendar component built with **pure Vanilla JavaScript** and **zero dependencies**: day, week, month, year and list views, resource columns and timelines, calendar and category filters, drag & drop, and themes for Tabler, Bootstrap and Bulma.

> Agendo started as a fork of **[simple-week-calendar-js](https://github.com/markmclaren/simple-week-calendar-js)** by [Mark McLaren](https://github.com/markmclaren). Many thanks to him for the clean, zero-dependency week calendar this project grew from. See [Acknowledgments](#-license-and-acknowledgments).

That project is itself inspired by and based on the classic [jquery-week-calendar](https://github.com/themouette/jquery-week-calendar) by [themouette](https://github.com/themouette). It has been completely rebuilt from the ground up for modern web development: no jQuery, no jQuery UI, no Moment.js, and no build tools required.

---

## ✨ Features

- **Zero Dependencies**: Pure ES6+ vanilla JavaScript and modern CSS. No jQuery, no bundlers, no runtime libraries required.
- **Interactive Drag & Drop**:
  - Click & drag on empty slots to create new events.
  - Drag events across days and time slots to move/reschedule.
  - Drag top/bottom resize handles to extend or shorten event duration.
- **Multiple Views**: Seamlessly switch between Day (1-day), Workweek (5-day), Week (7-day) and Month views.
- **Month View**: Full month grid with click-to-create, click-to-edit, drag-to-reschedule across days, multi-day events shown on every day they cover, and a "+N more" link that opens the day view.
- **List View**: Events grouped by day (*List* dropdown: day, week, month) with their time, colour and resource; multi-day events read "9:00 –", "all day", "– 17:00" like FullCalendar. Click a row to edit, click a date to open its day.
- **Year View**: Twelve mini months with coloured dots on days that have events (tooltip lists them). Click a day to open it, or a month name to open that month.
- **Resource Views**: Show resources (desks, rooms, people…) as columns. *Resources day* puts one column per resource for a single day; *Resources workweek* and *Resources week* show each date (5 or 7 days) with its resources underneath (dates above resources). Drag an event sideways to move it to another resource.
- **Resource Timeline**: Resources as rows with time running left to right (day / week / month, plus a custom span such as 3 days). The resource and timeline views are picked from two toolbar dropdowns, *Resources* and *Timeline*. Overlapping events stack in lanes; drag to create, move (also up/down to another resource) and resize from either end.
- **Calendars & Categories**: Link events to a calendar (`calendarId`) and a category (`categoryId`). A *Filter* dropdown in the toolbar has a checkbox for each one to show or hide its events; the event form gets a Calendar and a Category field.
- **All-day Events**: `allDay: true` events sit in an all-day row under the day headers, as bars across the days they cover; drag to create, move and resize them by whole days. They show first in month cells, as "all day" in the list, and as whole-day bars in timelines.
- **Recurring Events**: daily, weekly (chosen weekdays), monthly (same day, or "2nd Tuesday" / "last Friday"), yearly, every N, until a date or N times, with skipped dates. Rules are a subset of iCalendar RRULE. Editing, dragging or deleting an occurrence asks *This event / This and following events / All events*, like Google Calendar.
- **Background Events**: `display: 'background'` shades a period behind the events (lunch break, maintenance, holiday) without blocking clicks; `'inverse-background'` shades everything outside it (opening hours). Like FullCalendar's background events.
- **Plugins**: hooks to change how events are loaded, which fields the event form has, how events look and what the popover shows. The `eventDataModel` plugin (`plugins/event-data-model.js`) defines the information an event holds as a list of fields.
- **Event Popover**: hovering an event shows a card with all its details; short events fit their title and time on one line.
- **Smart Overlap Handling**: Automatically detects overlapping event clusters and arranges them side-by-side cleanly.
- **Current Time Indicator**: Live red indicator line showing the current day and time, updating automatically.
- **Native Localization**: Built-in 12-hour or 24-hour display using the standard `Intl.DateTimeFormat` API and browser locales.
- **Built-in Event Modal**: HTML5 `<dialog>` form for creating, editing, and deleting events with keyboard and validation support.
- **Business Hours**: Visual highlighting for configurable working hours.
- **Dark Mode**: `colorScheme: 'dark'`, `'light'` or `'auto'` (follows the OS, live). The framework themes switch to their own dark palette with it.
- **Theming**: Every colour, radius and shadow is a CSS custom property. Ready-made themes for **Tabler**, **Bootstrap 5** and **Bulma 1.x** follow the framework's own variables, including its dark mode.

---

## 🚀 Quick Start

### 1. Include the Stylesheet and Script

Add `agendo.css` and `agendo.js` to your HTML page:

```html
<link rel="stylesheet" href="agendo.css" />
<script src="agendo.js"></script>
```

### 2. Add a Container

```html
<div id="calendar-container"></div>
```

### 3. Initialize the Calendar

```javascript
const calendar = new Agendo('#calendar-container', {
  startHour: 7,
  endHour: 21,
  use24Hour: false,
  events: [
    {
      id: '1',
      title: 'Sprint Planning',
      start: new Date(2026, 10, 9, 9, 0),
      end: new Date(2026, 10, 9, 10, 30),
      color: '#3b82f6',
      resourceId: 'desk-1'
    }
  ],
  resources: [
    { id: 'desk-1', title: 'Desk 1', color: '#3b82f6' },
    { id: 'desk-2', title: 'Desk 2', color: '#10b981' }
  ],
  onEventChange: (event, action) => {
    console.log(`Event ${action}:`, event);
  },
  onEventCreate: (event) => {
    console.log('Event created:', event);
  },
  onEventDelete: (id) => {
    console.log('Event deleted:', id);
  }
});
```

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `date` | `Date` | `new Date()` | Initial date displayed in the calendar. |
| `daysToShow` | `number \| string` | `7` | View to display: `1` = day, `5` = workweek, `7` = full week, `'month'` = month grid, `'year'` = twelve mini months, `'list-day'` / `'list-week'` / `'list-month'` = event list, `'resource-day'` / `'resource-workweek'` / `'resource-week'` = one column per resource, `'timeline-day'` / `'timeline-week'` / `'timeline-month'` / `'timeline-custom'` = one row per resource. |
| `colorScheme` | `'light' \| 'dark' \| 'auto' \| null` | `null` | Light or dark colours; `'auto'` follows the OS setting and its changes. When set, the calendar element also gets `data-bs-theme` and `data-theme`, so the Tabler, Bootstrap and Bulma themes switch with it. `null` keeps the light colours and lets a framework theme follow the page. |
| `views` | `Array \| null` | `null` | View buttons to show in the toolbar, e.g. `[1, 7, 'month', 'list-week']`. Also takes `'day'`, `'workweek'`, `'week'`, and `'list'`, `'resource'`, `'timeline'` for a whole menu. `null` shows every view. Empty menus and groups are hidden, and the whole switcher is hidden when only one view is left. If `daysToShow` is not among them, the first shown view is used. |
| `calendars` | `Array` | `[]` | Calendars (Work, Personal…): `{ id, title, color?, visible? }`. Events are assigned with `calendarId`. Each one gets a checkbox in the *Filter* menu; `visible: false` starts it unchecked. |
| `categories` | `Array` | `[]` | Categories (Meeting, Training…): `{ id, title, color?, visible? }`, assigned with `categoryId`, filtered like calendars. The *Filter* menu is hidden when both lists are empty. An event's colour is its own `color`, else its category's, its calendar's, then its resource's. |
| `resources` | `Array` | `[]` | Resources shown in the resource views: `{ id, title, color? }`. Events are assigned with `resourceId`; an event without `color` takes its resource's color. The resource buttons are hidden when the list is empty. |
| `firstDayOfWeek` | `number` | `1` | First day of week (`0` = Sunday, `1` = Monday). |
| `startHour` | `number` | `0` | Earliest hour visible in the daily timeline (0–23). |
| `endHour` | `number` | `24` | Latest hour visible in the daily timeline (1–24). |
| `slotsPerHour` | `number` | `4` | Number of time slots per hour (`4` = 15-minute intervals). |
| `slotHeight` | `number` | `24` | Height in pixels for each time slot. |
| `use24Hour` | `boolean` | `false` | Whether to display hours in 24-hour military format. |
| `locale` | `string` | `navigator.language` | BCP 47 language tag for date and time formatting. |
| `businessHours` | `object \| false` | `{ start: 9, end: 18 }` | Highlighted business hours or `false` to disable. |
| `events` | `Array` | `[]` | Initial array of event objects. |
| `readonly` | `boolean` | `false` | Disable all interaction (creating, moving, resizing, editing). |
| `enableCreate` | `boolean` | `true` | Allow drag-to-create on empty slots. |
| `enableMove` | `boolean` | `true` | Allow dragging events to move them. |
| `enableResize` | `boolean` | `true` | Allow dragging handles to resize events. |
| `showCurrentTime` | `boolean` | `true` | Display the real-time indicator line. |
| `timelineCustom` | `object \| null` | `null` | Enables the `'timeline-custom'` view: `{ days: 3, slotMinutes: 30, labelMinutes: 60, slotWidth: 24, label: '3 days' }` (slot size, time-label interval, slot width in px). Use `slotMinutes: 1440` for one slot per day. |
| `theme` | `string \| null` | `null` | Theme name: adds the class `ago-theme-<name>` to the container (`'tabler'`, `'bootstrap'`, `'bulma'`, or your own). Load the matching stylesheet. |
| `resourceLabel` | `string` | `'Resources'` | Header of the resource column in timeline views. |
| `enableAllDay` | `boolean` | `true` | *All day* checkbox in the event form and drag to create in the all-day row. When `false`, existing all-day events still show and stay all-day when edited. |
| `enableRecurring` | `boolean` | `true` | *Repeat* section in the event form. When `false`, new events cannot repeat; existing recurring events still show, and changing an occurrence still asks this / following / all. |
| `openEventOn` | `'click' \| 'dblclick'` | `'click'` | The gesture that opens an event (the edit dialog, or `onEventClick`), in every view. `'dblclick'` opens on a second click on the same event within 400 ms, which also works as a double tap on touch screens; a single click then does nothing, so events can be dragged without opening by mistake. |
| `eventPopover` | `boolean \| Function` | `true` | On mouse hover (after a short pause), a card with the event's title, date and time, repeat rule, resource, calendar, category, `location` and `description`. `false` turns it off (events then get a native tooltip); a function `(event) => Node \| string \| null` supplies your own content (`null` = no popover). |
| `weekNumbers` | `boolean` | `false` | Week numbers in every view: "W47" in the corner of the day / week / resource grids, a column in month view and in each year-view month (click one to open that week), next to the first day of each week in lists, and at week starts in timelines. |
| `weekNumberCalculation` | `'auto' \| 'ISO' \| 'local' \| Function` | `'auto'` | `'ISO'`: ISO 8601 (weeks start on Monday, week 1 holds the year's first Thursday). `'local'`: weeks start on `firstDayOfWeek`, week 1 holds 1 January (US style). `'auto'`: ISO when `firstDayOfWeek` is Monday, else local. Or `(date) => number`. |
| `allDaySlot` | `boolean` | `true` | Show the all-day row in the day, week and resource views. |
| `monthMaxEvents` | `number` | `3` | Events listed per day in month view before collapsing the rest into "+N more". |
| `onEventClick` | `Function \| null` | `null` | `(event) => void`, called when an event is opened (click or double-click, see `openEventOn`) instead of the edit dialog. |
| `onEventChange` | `Function \| null` | `null` | `(event, action, info?) => void`; `action` is `'move'`, `'resize'` or `'edit'`, and for recurring events also `'exclude'` (a date was skipped) or `'truncate'` (the series now ends earlier). See [Recurring events](#recurring-events) for `info`. |
| `onEventCreate` | `Function \| null` | `null` | `(event, info?) => void`. |
| `plugins` | `Array` | `[]` | Plugins, see [Plugins](#-plugins). |
| `onFilterChange` | `Function \| null` | `null` | Called when the filter changes, with the ids still shown: `({ calendars, categories }) => void`. |
| `onEventDelete` | `Function \| null` | `null` | `(id, info?) => void`. |

---

## 🗓️ Events

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string \| number` | Generated when missing. |
| `title` | `string` | |
| `start`, `end` | `Date \| string` | A `'YYYY-MM-DD'` string is a local date. |
| `allDay` | `boolean` | Whole days: `end` is **exclusive** (as in iCalendar), so `start: '2026-11-23', end: '2026-11-26'` covers the 23rd to the 25th. Without `end`, one day. |
| `recurrence` | `Object \| string` | Repeat rule, see below. |
| `color` | `string` | Otherwise the colour of its category, calendar or resource. |
| `resourceId`, `calendarId`, `categoryId` | `string` | Links to `resources`, `calendars`, `categories`. |
| `editable` | `boolean` | `false`: the event cannot be dragged, resized or opened in the form. |
| `display` | `'auto' \| 'background' \| 'inverse-background'` | `'background'`: a shaded area behind the events, not clickable or draggable (clicks create events on it). `'inverse-background'`: shades every time **not** covered by it. See below. |
| `location`, `description` | `string` | Shown in the hover popover (the description keeps its line breaks). |

```javascript
{ id: 'conf', title: 'Conference', allDay: true, start: '2026-11-23', end: '2026-11-26' }
```

### Background events

```javascript
// Shaded every weekday at lunch, in grey
{ title: 'Lunch break', display: 'background', color: '#94a3b8',
  start: '2026-11-23T12:00', end: '2026-11-23T13:30', recurrence: { freq: 'weekly', byDay: ['MO','TU','WE','TH','FR'] } }
// Only on Desk 2's column / row in the resource views
{ title: 'Maintenance', display: 'background', resourceId: 'desk-2', color: '#ef4444', start: '2026-11-25T14:00', end: '2026-11-25T18:00' }
// Everything outside 9:00–17:00 on weekdays (and whole weekends) is shaded
{ display: 'inverse-background', start: '2026-11-23T09:00', end: '2026-11-23T17:00', recurrence: { freq: 'weekly', byDay: ['MO','TU','WE','TH','FR'] } }
```

| View | Shown as |
| :--- | :--- |
| Day / week / resource views | A block over the event's hours in each column it covers; an all-day one shades the whole column and its all-day cell. With a `resourceId`, only that resource's columns; without, every column. |
| Timeline | A block across the resource's row (every row without `resourceId`). |
| Month | The day cell, when the event is all-day or covers the whole day. |
| List, Year | Not shown. |

The colour is the event's (or its category's, calendar's…) at 30 % opacity, `--ago-bgevent-color` (`#8fdf82`) by default; `--ago-bgevent-alpha` sets the opacity. Inverse events are combined: what none of them covers is shaded, in the first one's colour.

### Recurring events

```javascript
{
  id: 'standup', title: 'Standup', start: '2026-11-23T09:00', end: '2026-11-23T09:15',
  recurrence: {
    freq: 'weekly',                          // 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: 1,                             // every N days / weeks / months / years
    byDay: ['MO', 'TU', 'WE', 'TH', 'FR'],   // weekly: weekdays; monthly: ['2TU'] = 2nd Tuesday, ['-1FR'] = last Friday
    until: '2027-06-30',                     // last possible date (included), or count: 20; neither = no end
    exdates: ['2026-12-25']                  // dates skipped
  }
}
// or an iCalendar RRULE string:
{ id: 'gym', title: 'Gym', start: '2026-11-22T07:30', end: '2026-11-22T08:30', recurrence: 'FREQ=WEEKLY;BYDAY=WE,SU' }
```

- Occurrences are generated for the dates on screen, never stored, so a rule without end costs nothing. They keep their local time across daylight-saving changes. A monthly day a month lacks (the 31st, a 5th Monday) and 29 February are skipped, as in iCalendar. `count` includes skipped dates, as in iCalendar.
- Each occurrence is a copy of the event with `id: '<id>::YYYY-MM-DD'`, `recurringId` (the event's id) and `occurrence` (its date). `onEventClick` receives it.
- The event form has a **Repeat** choice: Daily, Weekly on <day>, Every weekday, Monthly on day N, Monthly on the N-th <day>, Yearly, or Custom (every N days / weeks / months / years, weekdays, ends never / on a date / after N times).
- Changing, dragging or deleting an occurrence asks which occurrences it applies to. The callbacks then describe the change to store, with `info = { scope, recurringId, occurrence }`:

| Choice | Change | Callbacks |
| :--- | :--- | :--- |
| This event | The date is added to `exdates` and a single event takes its place. | `onEventChange(series, 'exclude', info)`, then `onEventCreate(single, info)` |
| This and following events | The series ends the day before (`until`, or a smaller `count`), a new series starts with the change. | `onEventChange(series, 'truncate', info)`, then `onEventCreate(newSeries, info)` |
| All events | The series takes the change; moving by days also moves its weekdays (Monday → Tuesday) and skipped dates. | `onEventChange(series, action, info)` |
| Delete: this / following / all | Skip the date / end the series the day before / remove the series. | `'exclude'` / `'truncate'` / `onEventDelete(id, info)` |

If the repeat rule itself changes in the form, *This event* is not offered. Choosing *Does not repeat* turns the series into that one event.

## 🧩 Plugins

A plugin is an object of hooks, given in the `plugins` option. Each hook is optional; hooks run in the order of the plugins.

```javascript
new Agendo('#calendar', { plugins: [myPlugin, Agendo.eventDataModel({ fields: [/* … */] })] });
```

| Hook | Called | Purpose |
| :--- | :--- | :--- |
| `install(calendar)` | Once, after the calendar is built and before the events load | Keep the calendar, add listeners. |
| `datesSet(from, to, view, calendar)` | After each render | The dates on screen: load their events from a server… |
| `eventCreated(event, info)`, `eventChanged(event, action, info)`, `eventDeleted(id, info)` | After a change made in the calendar (form, drag, recurring scope), with the `onEvent…` callbacks | Save the change; several plugins can listen. Changes made through the API (`addEvent`, `setEvents`…) are not reported. |
| `toolbar(slot, calendar)` | Once, after `install` | Add buttons to the toolbar (`slot` is a button group, hidden while empty). `<button class="ago-btn ago-icon-btn" data-tip="Label" aria-label="Label">` + an SVG gives an icon button whose label shows on hover and focus. |
| `normalizeEvent(event, raw)` | For every event loaded, added, updated or saved | Return the event with its fields given their type and defaults. |
| `eventSource(from, to, calendar)` | When the dates on screen change | Return extra events for `[from, to)`. They show like the others but are not part of the data (not in `getEvents()`, not saved). |
| `beforeRenderEvents(events, calendar)` | Before each drawing of the events | See all the events on screen at once (to compare them). |
| `formFields(fields, { event, isNew, calendar })` | When the event form opens | Return the list of fields: remove core ones, reorder, relabel (`{ name, core: true, label }`), add custom ones. |
| `validate(data, { event, calendar, action })` | When the form is saved (`action: 'save'`) and when a dragged event is dropped (`'move'`, `'resize'`) | Return `{ field: 'message' }` to refuse: the form shows the message on that field; a refused drop goes back, with the message at the bottom of the calendar. |
| `eventContent(event, element, view)` | Each event drawn (`view`: `'timeGrid'`, `'allDay'`, `'month'`, `'timeline'`, `'list'`) | Add to or change the event's element. |
| `popoverContent(parts, event)` | When the hover card opens | Return the card's elements, with yours added. |
| `destroy(calendar)` | On `calendar.destroy()` | Clean up. |

`calendar.getPlugin(name)` returns the plugin whose `name` property matches, to reach its own API. `calendar.notify(message)` shows a short message at the bottom of the calendar; `calendar.redraw()` draws the events again. An event with `editable: false` cannot be dragged, resized or opened in the form (`onEventClick` still gets it).

**Core form fields**, in their default order: `title`, `allDay`, `start`, `end`, `repeat`, `resource`, `calendar`, `category` (`Agendo.CORE_FIELDS`). A field left out of the list is hidden but keeps its value. `start` and `end` should stay; without `title`, events are "Untitled Event".

**Custom fields** in the list are drawn by the core: `{ name, label, type, default, required, min, max, step, pattern, placeholder, maxLength, rows, help, options }`, with `type` among `text`, `textarea`, `number`, `select` (`options`: values or `{ value, label }`), `checkbox`, `date`, `time`, `url`, `email`, `color`. The browser checks `required`, `min`, `max` and `pattern`. Their values are saved on the event under `name` (booleans for checkboxes, numbers for numbers) and reach the callbacks with it.

A plugin that relabels the title and logs every event drawn in month view:

```javascript
const myPlugin = {
  name: 'my-plugin',
  formFields: fields => fields.map(f => (f.name === 'title' ? { ...f, label: 'Subject' } : f)),
  eventContent: (event, el, view) => { if (view === 'month') console.log(event.title); }
};
```

### Sample plugins

Each is a separate file in `plugins/`, loaded after `agendo.js`; the demo turns them on in *Customize → Plugins*.

| Plugin | File | What it does | Hooks |
| :--- | :--- | :--- | :--- |
| `Agendo.holidays({ country, display, color, extra })` | `holidays.js` | Public holidays of `'FR'`, `'DE'`, `'GB'` (England and Wales) or `'US'`, as shaded days (`display: 'background'`) or all-day events that cannot be edited (`'auto'`). Easter-based ones are computed; `extra: [{ date: 'MM-DD', title }]` adds your own. `getPlugin('holidays').list(2027)` lists a year. | `eventSource` |
| `Agendo.conflicts({ by, block, ignore })` | `conflicts.js` | Overlapping events of the same resource (`by: 'resource'`) or any two (`'all'`) get a red outline and ⚠. With `block: true`, saving or dropping onto a booked time is refused: "Desk 2 is already booked: "Lunch with Mike" (12:00–13:15)". Recurring events count through their occurrences. | `beforeRenderEvents`, `eventContent`, `validate` |
| `Agendo.ical({ filename })` | `ical.js` | Export and import icon buttons in the toolbar (label on hover and focus). Export: all-day dates, local times, RRULE + EXDATE, location, description, category, and resource / calendar / colour / display as `X-AGENDO-*`, so a round trip keeps them; lines folded at 75 octets. Import: DTSTART / DTEND or DURATION, UTC times, RRULE, EXDATE (times with a TZID are read as local). API: `toICS()`, `parse(text)`, `download()`, `import(text)`. | `toolbar` |
| `Agendo.timeProgress({ dimPast, progress, every })` | `time-progress.js` | Finished events fade; a running event gets a progress bar and "· 25 min left", refreshed every minute. | `install`, `eventContent`, `destroy` |
| `Agendo.restStorage({ url, headers, onError })` | `rest-storage.js` | Events kept in a database behind a REST API: the dates on screen are fetched by whole months (each once), every change made in the calendar is sent (`POST`, `PUT /:id`, `DELETE /:id`). API: `reload()`, `save(event)`, `remove(id)`, `health()`. See [Database demo](#database-demo-nodejs). | `datesSet`, `eventCreated`, `eventChanged`, `eventDeleted` |
| `Agendo.eventDataModel({ fields, hide, order })` | `event-data-model.js` | Custom event fields, see below. | `normalizeEvent`, `formFields`, `validate`, `eventContent`, `popoverContent` |

### eventDataModel

`plugins/event-data-model.js` (load it after `agendo.js`) describes what an event holds, beyond the core fields:

```html
<script src="agendo.js"></script>
<script src="plugins/event-data-model.js"></script>
```

```javascript
new Agendo('#calendar', {
  plugins: [Agendo.eventDataModel({
    fields: [
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'priority', label: 'Priority', type: 'select', default: 'normal', popover: true,
        options: [{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High', color: '#dc2626' }],
        badge: v => (v === 'high' ? 'High' : null) },
      { name: 'attendees', label: 'Attendees', type: 'number', min: 1, max: 50, popover: true,
        validate: (v, data) => (v > 20 && !data.online ? 'More than 20 attendees: make it an online meeting' : null) },
      { name: 'online', label: 'Online meeting', type: 'checkbox', badge: 'Online' },
      { name: 'description', label: 'Notes', type: 'textarea' }
    ],
    hide: ['category'],                       // core fields left out of the form
    order: ['title', 'location', 'start']     // these first, the others after in their order
  })]
});
```

| Field option | Effect |
| :--- | :--- |
| `type`, `required`, `min`, `max`, `step`, `pattern`, `placeholder`, `maxLength`, `rows`, `help`, `options` | The form input (see above). |
| `default` | Value for new events and for loaded events without one (a function gets the event). |
| `validate(value, data)` | Return a message to block the save. |
| `badge` | Show the value on the event: `true` (the value, a select option's label and `color`), a string (that text when the value is set), or `(value, event) => text \| null`. |
| `popover` | Show the field in the hover card (`location` and `description` already are). |

Loaded values are given their type: `"12"` becomes `12` for a number, `"true"` becomes `true` for a checkbox, a select value outside its options takes the default. In the demo, *Customize → Plugins → Custom fields* turns this plugin on with an example model.

## 📖 Public API Methods

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `prev()` | — | Navigate back by 1 day, 1 week, 1 month, 1 year, or the custom timeline span, depending on the view. |
| `next()` | — | Navigate forward by 1 day, 1 week, 1 month, 1 year, or the custom timeline span, depending on the view. |
| `today()` | — | Jump to the current date. |
| `gotoDate(date)` | `Date \| string` | Navigate to a specific date. |
| `setView(view)` | `1 \| 5 \| 7 \| 'month' \| 'year' \| 'list-day' \| 'list-week' \| 'list-month' \| 'resource-day' \| 'resource-workweek' \| 'resource-week' \| 'timeline-day' \| 'timeline-week' \| 'timeline-month' \| 'timeline-custom'` | Switch view. |
| `setColorScheme(scheme)` | `'light' \| 'dark' \| 'auto' \| null` | Switch light / dark colours. |
| `getColorScheme()` | — | Returns `'light'` or `'dark'`: the colours shown (resolves `'auto'`). |
| `setViews(views)` | `Array \| null` | Change which view buttons show (same values as the `views` option). |
| `getViews()` | — | Returns the keys of the view buttons shown. |
| `getPlugin(name)` | `string` | The plugin with that `name`, or `null`. |
| `notify(message, ms?)` | `string, number` | Show a short message at the bottom of the calendar (default 3.5 s). |
| `redraw()` | — | Draw the events again. |
| `getResources()` | — | Returns a shallow copy of the resources. |
| `setResources(resources)` | `Array` | Replace the resource list and re-render. |
| `getCalendars()` / `setCalendars(calendars)` | `Array` | Read or replace the calendar list. |
| `getCategories()` / `setCategories(categories)` | `Array` | Read or replace the category list. |
| `getFilter()` | — | Returns `{ calendars, categories }`: the ids whose events are shown. |
| `setFilter({ calendars?, categories? })` | `Object` | Show only the given ids; a key left out keeps its state. Events with no calendar or category, or one not in the lists, always show. |
| `scrollToHour(hour)` | `number` | Scroll the timeline to a specific hour. |
| `getEvents()` | — | Returns a shallow copy of all current events, as stored: a recurring event once, with its `recurrence`. |
| `getOccurrences(start, end)` | `Date \| string` × 2 | Every event and occurrence overlapping `[start, end)`. |
| `Agendo.parseRRule(str)` / `Agendo.toRRule(rule)` | `string` / `Object` | Convert between an RRULE string and a rule object (static). |
| `setEvents(events)` | `Array` | Replace the current event list and re-render. |
| `addEvent(event)` | `Object` | Add a single event and re-render. Returns normalized event. |
| `updateEvent(id, updates)` | `string, Object` | Update properties on an existing event. |
| `deleteEvent(id)` | `string` | Remove an event by its ID. |
| `openCreateModal(start, end, resourceId?)` | `Date, Date, string` | Manually trigger the "New Event" dialog. |
| `openEditModal(event)` | `Object` | Manually trigger the "Edit Event" dialog. |
| `setTheme(name)` | `string \| null` | Switch theme (`null` = default look). |
| `destroy()` | — | Unbind timers, empty container, and clean up classes. |

---

## 🎨 Theming

### Ready-made themes

Load the theme stylesheet after `agendo.css` and pass its name:

```html
<link rel="stylesheet" href="agendo.css" />
<link rel="stylesheet" href="themes/bootstrap.css" />  <!-- or tabler.css / bulma.css -->
```

```javascript
new Agendo('#calendar-container', { theme: 'bootstrap' });
calendar.setTheme('bulma');   // switch later
```

| Theme | File | Reads the framework's variables |
| :--- | :--- | :--- |
| Tabler | `themes/tabler.css` | `--tblr-*` (`@tabler/core` 1.x) |
| Bootstrap | `themes/bootstrap.css` | `--bs-*` (Bootstrap 5.3) |
| Bulma | `themes/bulma.css` | `--bulma-*` (Bulma 1.x) |

When the framework is loaded on the page, the calendar picks up its colours, font, radius and dark mode (`data-bs-theme="dark"` for Tabler and Bootstrap, `data-theme="dark"` or the OS setting for Bulma), including any customisation of those variables. Without the framework, each theme falls back to the framework's default light values.

All font sizes scale from `--ago-rem`: on a site whose root font size is not 16px (for example `html { font-size: 62.5% }`), set `--ago-rem: 16px` in your theme.

### Your own theme

Override the `--ago-*` properties on `.agendo` (or on a `.ago-theme-<name>` class used with `theme: '<name>'`):

| Variable | Used for |
| :--- | :--- |
| `--ago-rem` | Base unit for every font size (default `1rem`) |
| `--ago-font-family` | Font |
| `--ago-bg`, `--ago-surface`, `--ago-non-business-hour` | Background, headers / toolbar surfaces, hours outside business hours |
| `--ago-border`, `--ago-border-subtle`, `--ago-border-strong` | Grid lines, slot lines, day separators |
| `--ago-text`, `--ago-text-muted` | Text |
| `--ago-primary`, `--ago-primary-hover`, `--ago-primary-light`, `--ago-on-primary` | Active buttons, today, selection; text on primary |
| `--ago-danger`, `--ago-danger-hover`, `--ago-on-danger` | Delete button |
| `--ago-bgevent-color`, `--ago-bgevent-alpha` | Background events without a colour (`#8fdf82`), and their opacity (`30%`) |
| `--ago-current-time`, `--ago-today-bg` | Now indicator, today's column in timelines |
| `--ago-event-bg`, `--ago-event-color`, `--ago-event-border-radius` | Events without their own `color` |
| `--ago-radius`, `--ago-btn-radius`, `--ago-dialog-radius` | Corner radii |
| `--ago-btn-padding`, `--ago-btn-font-size`, `--ago-btn-font-weight`, `--ago-btn-bg`, `--ago-btn-hover-bg`, `--ago-btn-shadow` | Toolbar buttons |
| `--ago-menu-shadow`, `--ago-dialog-shadow`, `--ago-focus-ring` | Dropdowns, dialog, focus outline |
| `--ago-title-font-size`, `--ago-time-col-width`, `--ago-resource-col-width` | Title size, hour column, resource column |

---

## 🖥️ Running the Demo

Because [`index.html`](file:///index.html) fetches [`events.json`](file:///events.json) using the `fetch()` API, run a lightweight HTTP server in the repository root rather than opening via `file://`:

```bash
# The demo server (Node.js 22+, also stores events in a database: see below)
node server/server.js

# Or any static server
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser. The moon / sun button in the header switches the page and the calendar between light and dark (the first visit follows the OS). The **Customize** button opens a sidebar to try the options live: theme, colour scheme (light, dark, auto), view buttons, locale, first day of the week, 24-hour clock, week numbers, hours and business hours, slot length and height, current time line, events per month day, resources, custom timeline, calendar and category filter, all-day row, plugins (holidays, conflict checker, iCalendar, time progress, custom fields), read-only and editing switches (create, move, resize, all-day events, recurring events) and the hover popover. Its *Background events* section lists the background events and adds, edits or deletes them (title, shade this time or everything else, colour, all day, dates, resource, repeat) through `addEvent`, `updateEvent` and `deleteEvent`, since background events cannot be clicked in the calendar. Each change rebuilds the calendar with the new options and keeps its events, date, view and filter; the settings are remembered in the browser, *Reset to defaults* restores them, and *Options code* shows the matching `new Agendo(…)` options to copy.

In the sidebar, the Tabler, Bootstrap and Bulma themes load their framework from the jsDelivr CDN (pinned versions with integrity hashes).

### Database demo (Node.js)

`server/server.js` serves the demo and stores its events in a database, with no dependencies: SQLite through Node's built-in `node:sqlite` (Node 22.13+ / 23.4+), or a JSON file on older versions.

```bash
node server/server.js                    # http://localhost:8000, database server/agendo.db
node server/server.js --port 3000 --db /tmp/agenda.db
node server/server.js --reset            # start again from the sample events
```

Open its address, then *Customize → Plugins → Database storage*: the calendar now loads its events from the database (the status line shows the storage and the number of events) and saves every change, recurring ones included. Reload the page: everything comes back.

| Request | Effect |
| :--- | :--- |
| `GET /api/health` | `{ ok, storage: 'sqlite' \| 'json', events }` |
| `GET /api/events?start=ISO&end=ISO` | Events overlapping the range, and recurring events starting before its end |
| `GET /api/events/:id` | One event |
| `POST /api/events` | Create an event (body: the event) → `201` |
| `PUT /api/events/:id` | Replace an event → `200` |
| `DELETE /api/events/:id` | Delete an event → `204` |

Each event is stored whole (custom fields included) with its time span indexed for range queries; dates are ISO instants, all-day ones `YYYY-MM-DD`. A new database gets the sample events of `events.json`, moved to the current week (`--no-seed` to start empty). The server listens on `127.0.0.1` only, serves the demo's files (never `server/` or dot files) and checks what it stores; it is a demo, without authentication. The database files are ignored by git.

### Performance test

The line above the calendar shows the time of the last render (view change, previous / next, today): build time, time until painted, events loaded and events in the dates on screen. The *Performance test* section of the Customize sidebar generates 10 to 1,000,000 events in the browser (`data/generate-events.js`, deterministic: the same count gives the same events), spread over a month, a year or five years, and reports the time of each step (generate, `setEvents`, first render, until painted). *Benchmark all views* renders every view in turn with the time of each; *Restore demo data* brings the sample events back.

Each render keeps only the events overlapping the dates on screen (one pass over the events), so the views then work on those alone; the cost of a view grows with the events it shows, not with the events loaded.

---

## 📄 License and Acknowledgments

Agendo stands on the shoulders of two projects:

- **[simple-week-calendar-js](https://github.com/markmclaren/simple-week-calendar-js)** by [Mark McLaren](https://github.com/markmclaren): the zero-dependency Vanilla JavaScript week calendar that Agendo was forked from. Its time grid, drag to create, move and resize, overlap layout, event dialog and demo are the foundation everything else was built on. Thank you, Mark!
- **[jquery-week-calendar](https://github.com/themouette/jquery-week-calendar)** by [Rob Monie / themouette](https://github.com/themouette): the classic jQuery plugin that simple-week-calendar-js modernized and rewrote without jQuery, jQuery UI or Moment.js.

On top of that base, Agendo adds the month, year and list views, resource columns and timelines, calendar and category filters, configurable view buttons, theming (Tabler, Bootstrap, Bulma) and the Customize demo sidebar.

Released under the [MIT License](LICENSE), keeping the copyright notice of the original project.


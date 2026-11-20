# Simple Week Calendar JS

A modern, lightweight day / week / month calendar component built with **pure Vanilla JavaScript** and **zero dependencies**.

This project is inspired by and based on the classic [jquery-week-calendar](https://github.com/themouette/jquery-week-calendar) by [themouette](https://github.com/themouette). It has been completely rebuilt from the ground up for modern web development: no jQuery, no jQuery UI, no Moment.js, and no build tools required.

---

## ✨ Features

- **Zero Dependencies**: Pure ES6+ vanilla JavaScript and modern CSS. No jQuery, no bundlers, no runtime libraries required.
- **Interactive Drag & Drop**:
  - Click & drag on empty slots to create new events.
  - Drag events across days and time slots to move/reschedule.
  - Drag top/bottom resize handles to extend or shorten event duration.
- **Multiple Views**: Seamlessly switch between Day (1-day), Workweek (5-day), Week (7-day) and Month views.
- **Month View**: Full month grid with click-to-create, click-to-edit, drag-to-reschedule across days, multi-day events shown on every day they cover, and a "+N more" link that opens the day view.
- **Smart Overlap Handling**: Automatically detects overlapping event clusters and arranges them side-by-side cleanly.
- **Current Time Indicator**: Live red indicator line showing the current day and time, updating automatically.
- **Native Localization**: Built-in 12-hour or 24-hour display using the standard `Intl.DateTimeFormat` API and browser locales.
- **Built-in Event Modal**: HTML5 `<dialog>` form for creating, editing, and deleting events with keyboard and validation support.
- **Business Hours**: Visual highlighting for configurable working hours.
- **CSS Variables**: Easily themed via CSS custom properties.

---

## 🚀 Quick Start

### 1. Include the Stylesheet and Script

Add `week-calendar.css` and `week-calendar.js` to your HTML page:

```html
<link rel="stylesheet" href="week-calendar.css" />
<script src="week-calendar.js"></script>
```

### 2. Add a Container

```html
<div id="calendar-container"></div>
```

### 3. Initialize the Calendar

```javascript
const calendar = new WeekCalendar('#calendar-container', {
  startHour: 7,
  endHour: 21,
  use24Hour: false,
  events: [
    {
      id: '1',
      title: 'Sprint Planning',
      start: new Date(2026, 10, 9, 9, 0),
      end: new Date(2026, 10, 9, 10, 30),
      color: '#3b82f6'
    }
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
| `daysToShow` | `number \| 'month'` | `7` | View to display (`1` = day, `5` = workweek, `7` = full week, `'month'` = month grid). |
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
| `monthMaxEvents` | `number` | `3` | Events listed per day in month view before collapsing the rest into "+N more". |
| `onEventClick` | `Function \| null` | `null` | Called when an event is clicked. Defaults to opening edit dialog. |
| `onEventChange` | `Function \| null` | `null` | Callback signature: `(event, 'move' | 'resize' | 'edit') => void`. |
| `onEventCreate` | `Function \| null` | `null` | Callback signature: `(event) => void`. |
| `onEventDelete` | `Function \| null` | `null` | Callback signature: `(id) => void`. |

---

## 📖 Public API Methods

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `prev()` | — | Navigate back by 1 day (day view), 1 week, or 1 month (month view). |
| `next()` | — | Navigate forward by 1 day (day view), 1 week, or 1 month (month view). |
| `today()` | — | Jump to the current date. |
| `gotoDate(date)` | `Date \| string` | Navigate to a specific date. |
| `setView(view)` | `1 \| 5 \| 7 \| 'month'` | Switch to the day, workweek, week or month view. |
| `scrollToHour(hour)` | `number` | Scroll the timeline to a specific hour. |
| `getEvents()` | — | Returns a shallow copy of all current events. |
| `setEvents(events)` | `Array` | Replace the current event list and re-render. |
| `addEvent(event)` | `Object` | Add a single event and re-render. Returns normalized event. |
| `updateEvent(id, updates)` | `string, Object` | Update properties on an existing event. |
| `deleteEvent(id)` | `string` | Remove an event by its ID. |
| `openCreateModal(start, end)` | `Date, Date` | Manually trigger the "New Event" dialog. |
| `openEditModal(event)` | `Object` | Manually trigger the "Edit Event" dialog. |
| `destroy()` | — | Unbind timers, empty container, and clean up classes. |

---

## 🖥️ Running the Demo

Because [`index.html`](file:///index.html) fetches [`events.json`](file:///events.json) using the `fetch()` API, run a lightweight HTTP server in the repository root rather than opening via `file://`:

```bash
# Using Node.js (npx)
npx serve .

# Or using Python 3
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

---

## 📄 License and Acknowledgments

- Based on and inspired by [jquery-week-calendar](https://github.com/themouette/jquery-week-calendar) by [Rob Monie / themouette](https://github.com/themouette).
- Modernized, refactored, and rewritten to zero-dependency Vanilla JavaScript.
- Released under the [MIT License](https://opensource.org/licenses/MIT).


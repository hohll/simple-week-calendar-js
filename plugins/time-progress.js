/* Agendo plugin: timeProgress — finished events fade, running ones show how far along they are.
 *
 *   <script src="plugins/time-progress.js"></script>
 *   new Agendo('#calendar', { plugins: [Agendo.timeProgress()] });
 *
 * Options:
 *   dimPast    true (default): events that have ended get the class ago-past (faded)
 *   progress   true (default): a running event gets a progress bar and "ends in 25 min"
 *   every      refresh interval in ms (default 60000)
 *
 * Hooks: install (timer), eventContent, destroy.
 */
(function () {
  const STYLE = `
.ago-past { opacity: 0.5; }
.ago-past:hover { opacity: 0.8; }
.ago-running { box-shadow: 0 0 0 2px var(--ago-current-time, #ef4444) inset; }
.ago-progress { position: absolute; left: 0; bottom: 0; height: 3px; width: var(--ago-progress); background: rgb(255 255 255 / 0.85); pointer-events: none; }
.ago-remaining { margin-left: 4px; font-weight: 600; }`;

  function timeProgress({ dimPast = true, progress = true, every = 60000 } = {}) {
    let calendar, timer;
    const left = ms => {
      const min = Math.ceil(ms / 60000);
      return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60}` : ''}`;
    };
    return {
      name: 'timeProgress',
      install(cal) {
        calendar = cal;
        if (!document.getElementById('ago-progress-style')) {
          document.head.append(Object.assign(document.createElement('style'), { id: 'ago-progress-style', textContent: STYLE }));
        }
        timer = setInterval(() => calendar.redraw(), every);
      },
      eventContent(ev, el, view) {
        const now = Date.now();
        if (dimPast && ev.end <= now) { el.classList.add('ago-past'); return; }
        if (!progress || ev.start > now || ev.allDay) return;
        el.classList.add('ago-running');
        el.title = `Ends in ${left(ev.end - now)}`;
        if (view === 'list') return;
        const bar = Object.assign(document.createElement('div'), { className: 'ago-progress' });
        bar.style.setProperty('--ago-progress', `${Math.round(((now - ev.start) / (ev.end - ev.start)) * 100)}%`);
        el.append(bar);
        const time = el.querySelector('.ago-event-time');
        if (time && view === 'timeGrid') time.append(Object.assign(document.createElement('span'), { className: 'ago-remaining', textContent: `· ${left(ev.end - now)} left` }));
      },
      destroy() { clearInterval(timer); }
    };
  }

  if (typeof Agendo !== 'undefined') Agendo.timeProgress = timeProgress;
  if (typeof window !== 'undefined') window.AgendoTimeProgress = timeProgress;
})();

// Countdown driven by an absolute deadline rather than accumulated ticks, so a
// backgrounded (throttled) tab still shows true remaining time and expires
// correctly once it comes back to the foreground.

export function formatClock(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function createTimer({ onTick, onExpire, interval = 200 }) {
  let handle = null;
  let deadline = 0;

  function remainingSeconds() {
    return Math.max(0, (deadline - Date.now()) / 1000);
  }

  function tick() {
    const remaining = remainingSeconds();
    if (onTick) onTick(remaining);
    if (remaining <= 0) {
      stop();
      if (onExpire) onExpire();
    }
  }

  // Browsers throttle intervals in a hidden tab, so the clock can stall while
  // the user is away. Because the deadline is absolute nothing is lost — but
  // resync the moment the tab comes back rather than waiting for the next tick.
  function onVisibilityChange() {
    if (handle !== null && !document.hidden) tick();
  }

  function start(seconds) {
    stop();
    deadline = Date.now() + seconds * 1000;
    handle = setInterval(tick, interval);
    document.addEventListener('visibilitychange', onVisibilityChange);
    tick(); // may expire immediately, which stops the interval again
  }

  function stop() {
    if (handle !== null) {
      clearInterval(handle);
      handle = null;
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  return { start, stop, remainingSeconds };
}

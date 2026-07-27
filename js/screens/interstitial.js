// The two waiting screens: the countdown before memorising and the gap before
// reproduction. Both are the same thing with different wording.

import { createTimer } from '../timer.js';
import { showScreen, updateClock } from '../ui.js';

const heading = document.getElementById('countdown-heading');
const clock = document.getElementById('countdown-clock');

let onDone = null;

const timer = createTimer({
  onTick: (seconds) => updateClock(clock, seconds),
  onExpire: () => {
    const done = onDone;
    onDone = null;
    if (done) done();
  },
});

export function start({ text, seconds, onComplete }) {
  onDone = onComplete;
  heading.textContent = text;
  showScreen('countdown');
  timer.start(seconds);
}

export function stop() {
  onDone = null;
  timer.stop();
}

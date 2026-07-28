// Memorize stage: the whole list on the left, one word in focus in the middle,
// and a countdown that ends the stage on its own if the user does not.

import { createTimer } from '../timer.js';
import { levelLabel, renderColumns, setActiveItem, showScreen, updateClock } from '../ui.js';

const section = document.getElementById('screen-memorize');
const listEl = document.getElementById('memorize-list');
const clockEl = document.getElementById('memorize-clock');
const levelEl = document.getElementById('memorize-level');
const indexEl = document.getElementById('memorize-index');
const wordEl = document.getElementById('memorize-word');
const continueButton = document.getElementById('to-gap-button');

let run = null;
let current = 0;
let onDone = null;

const timer = createTimer({
  onTick: (seconds) => updateClock(clockEl, seconds),
  onExpire: () => finish(),
});

// Navigation wraps: forward from the last word lands on the first, and back
// from the first lands on the last.
function focusWord(index) {
  const total = run.words.length;
  current = ((index % total) + total) % total;
  indexEl.textContent = String(current + 1);
  wordEl.textContent = run.words[current];
  setActiveItem(listEl, current);
}

function move(step) {
  focusWord(current + step);
}

function onKeyDown(event) {
  if (event.key === 'ArrowRight' || (event.key === ' ' && !event.shiftKey)) {
    event.preventDefault();
    move(1);
  } else if (event.key === 'ArrowLeft' || (event.key === ' ' && event.shiftKey)) {
    event.preventDefault();
    move(-1);
  }
}

function finish() {
  if (!onDone) return;
  const done = onDone;
  stop();
  done();
}

export function start(activeRun, onComplete) {
  run = activeRun;
  onDone = onComplete;
  levelEl.textContent = levelLabel(run);

  renderColumns(
    listEl,
    run.words.length,
    (item, index) => {
      item.innerHTML = '';
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(index + 1);
      const text = document.createElement('span');
      text.className = 'text';
      text.textContent = run.words[index];
      item.append(num, text);
    },
    { onSelect: focusWord }
  );

  showScreen('memorize');
  focusWord(0);
  document.addEventListener('keydown', onKeyDown);
  timer.start(run.settings.memorizeSeconds);
}

export function stop() {
  onDone = null;
  timer.stop();
  document.removeEventListener('keydown', onKeyDown);
}

section.addEventListener('click', (event) => {
  const step = event.target.closest('[data-step]');
  if (step) move(Number(step.dataset.step));
});

// Touch: swipe the card sideways to move through the words, since there are no
// arrow keys on a phone. A swipe that is mostly vertical is left alone so the
// page can still be scrolled from the card.
const SWIPE_MIN_PX = 40;
const focusCard = section.querySelector('.focus-card');
let swipeStart = null;

focusCard.addEventListener('pointerdown', (event) => {
  swipeStart = event.pointerType === 'touch' ? { x: event.clientX, y: event.clientY } : null;
});

focusCard.addEventListener('pointerup', (event) => {
  if (!swipeStart) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) {
    move(dx < 0 ? 1 : -1);
  }
});

focusCard.addEventListener('pointercancel', () => {
  swipeStart = null;
});

continueButton.addEventListener('click', finish);

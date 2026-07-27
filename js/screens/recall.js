// Reproduction stage: type each word back in order. Answers are written into
// run.answers on every keystroke, so navigating away or running out of time can
// never lose what has been typed.

import { createTimer } from '../timer.js';
import { itemAt, levelLabel, renderColumns, setActiveItem, showScreen, updateClock } from '../ui.js';

const section = document.getElementById('screen-recall');
const listEl = document.getElementById('recall-list');
const clockEl = document.getElementById('recall-clock');
const levelEl = document.getElementById('recall-level');
const indexEl = document.getElementById('recall-index');
const inputEl = document.getElementById('recall-input');
const continueButton = document.getElementById('to-evaluation-button');

const BLANK = '—';

let run = null;
let current = 0;
let onDone = null;

const timer = createTimer({
  onTick: (seconds) => updateClock(clockEl, seconds),
  onExpire: () => finish(),
});

function paintItem(index) {
  const item = itemAt(listEl, index);
  if (!item) return;
  const answer = run.answers[index] ?? '';
  item.classList.toggle('empty', answer.trim() === '');
  item.querySelector('.text').textContent = answer.trim() === '' ? BLANK : answer;
}

// Navigation wraps, the same way it does while memorising.
function focusSlot(index) {
  if (!run) return;
  const total = run.words.length;
  current = ((index % total) + total) % total;
  indexEl.textContent = String(current + 1);
  inputEl.value = run.answers[current] ?? '';
  setActiveItem(listEl, current);
  inputEl.focus();
  // Land the caret after whatever is already typed, so returning to a slot
  // continues the word instead of overwriting it.
  inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
}

function move(step) {
  focusSlot(current + step);
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
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(index + 1);
      const text = document.createElement('span');
      text.className = 'text';
      item.append(num, text);
    },
    { onSelect: focusSlot }
  );
  run.words.forEach((_, index) => paintItem(index));

  showScreen('recall');
  focusSlot(0);
  timer.start(run.settings.recallSeconds);
}

export function stop() {
  onDone = null;
  timer.stop();
}

inputEl.addEventListener('input', () => {
  if (!run) return;
  run.answers[current] = inputEl.value;
  paintItem(current);
});

inputEl.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  move(event.shiftKey ? -1 : 1);
});

section.addEventListener('click', (event) => {
  const step = event.target.closest('[data-step]');
  if (step) move(Number(step.dataset.step));
});

continueButton.addEventListener('click', finish);

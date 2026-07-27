// Results screen: personal bests per level and a log of recent attempts.

import { clearAttempts, loadAttempts } from '../storage.js';
import { showScreen } from '../ui.js';

const summaryTable = document.getElementById('level-summary');
const historyTable = document.getElementById('attempt-history');
const clearButton = document.getElementById('clear-history-button');

function buildTable(table, headers, rows, emptyMessage) {
  table.textContent = '';

  if (rows.length === 0) {
    const caption = document.createElement('caption');
    caption.className = 'empty-state';
    caption.textContent = emptyMessage;
    table.append(caption);
    return;
  }

  const head = table.createTHead().insertRow();
  for (const header of headers) {
    const th = document.createElement('th');
    th.textContent = header;
    head.append(th);
  }

  const body = table.createTBody();
  for (const cells of rows) {
    const row = body.insertRow();
    for (const cell of cells) {
      const td = row.insertCell();
      if (cell && typeof cell === 'object') {
        td.textContent = cell.text;
        if (cell.className) td.className = cell.className;
      } else {
        td.textContent = String(cell);
      }
    }
  }
}

function summarise(attempts) {
  const byLevel = new Map();
  for (const attempt of attempts) {
    const key = attempt.level ?? `custom-${attempt.wordCount}`;
    const entry = byLevel.get(key) ?? {
      label: attempt.level ? `Level ${attempt.level}` : `Custom (${attempt.wordCount} words)`,
      sortKey: attempt.level ?? Number.MAX_SAFE_INTEGER,
      wordCount: attempt.wordCount,
      attempts: 0,
      bestCorrect: 0,
      bestPoints: 0,
      passed: false,
    };
    entry.attempts += 1;
    entry.bestCorrect = Math.max(entry.bestCorrect, attempt.correct ?? 0);
    entry.bestPoints = Math.max(entry.bestPoints, attempt.points ?? 0);
    entry.passed = entry.passed || Boolean(attempt.passed);
    byLevel.set(key, entry);
  }

  return [...byLevel.values()].sort((a, b) => a.sortKey - b.sortKey || a.wordCount - b.wordCount);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function render() {
  const attempts = loadAttempts();

  buildTable(
    summaryTable,
    ['Level', 'Words', 'Attempts', 'Best correct', 'Best points', 'Passed'],
    summarise(attempts).map((entry) => [
      entry.label,
      entry.wordCount,
      entry.attempts,
      entry.bestCorrect,
      entry.bestPoints,
      entry.passed ? { text: 'yes', className: 'pass' } : { text: 'not yet', className: 'fail' },
    ]),
    'No attempts recorded yet.'
  );

  buildTable(
    historyTable,
    ['When', 'Level', 'Words', 'Correct', 'Points', 'Result'],
    attempts
      .slice(0, 50)
      .map((attempt) => [
        formatDate(attempt.date),
        attempt.level ? `Level ${attempt.level}` : 'Custom',
        attempt.wordCount,
        attempt.correct ?? 0,
        attempt.points ?? 0,
        attempt.passed ? { text: 'passed', className: 'pass' } : { text: 'failed', className: 'fail' },
      ]),
    'No attempts recorded yet.'
  );
}

// Clearing is destructive, so the button asks for a second click rather than
// firing on the first one.
const CLEAR_LABEL = 'Clear history';
let clearArmed = false;

function disarmClear() {
  clearArmed = false;
  clearButton.textContent = CLEAR_LABEL;
}

export function show() {
  render();
  disarmClear();
  showScreen('results');
}

clearButton.addEventListener('click', () => {
  if (!clearArmed) {
    clearArmed = true;
    clearButton.textContent = 'Click again to delete every attempt';
    return;
  }
  clearAttempts();
  disarmClear();
  render();
});

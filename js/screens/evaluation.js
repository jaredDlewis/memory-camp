// Evaluation stage: the summary numbers plus a word-by-word review.

import { gradeAttempt } from '../scoring.js';
import { levelLabel, renderColumns, showScreen } from '../ui.js';

const levelEl = document.getElementById('evaluation-level');
const bannerEl = document.getElementById('evaluation-banner');
const statsEl = document.getElementById('evaluation-stats');
const listEl = document.getElementById('evaluation-list');
const retryButton = document.getElementById('retry-button');
const nextLevelButton = document.getElementById('next-level-button');
const homeButton = document.getElementById('evaluation-home-button');

const STATUS_LABEL = {
  correct: 'correct',
  typo: 'one character off',
  wrong: 'wrong',
  blank: 'not answered',
};

function renderStats(pairs) {
  statsEl.textContent = '';
  for (const [label, value] of pairs) {
    const group = document.createElement('div');
    group.className = 'stat';
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = String(value);
    group.append(dt, dd);
    statsEl.append(group);
  }
}

function renderReview(results) {
  renderColumns(listEl, results.length, (item, index) => {
    const result = results[index];

    const head = document.createElement('div');
    head.className = 'row-head';
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(index + 1);
    const answer = document.createElement('span');
    answer.className = `answer ${result.status}`;
    answer.textContent = result.status === 'blank' ? '—' : result.answer;
    answer.title = STATUS_LABEL[result.status];
    head.append(num, answer);

    const expected = document.createElement('span');
    expected.className = 'expected';
    expected.textContent = result.correct && result.status === 'correct' ? '' : result.word;

    item.append(head, expected);
  });
}

export function show(run, { onRetry, onNextLevel, onHome }) {
  const evaluation = gradeAttempt(run.words, run.answers, {
    acceptTypos: run.settings.acceptTypos,
  });

  levelEl.textContent = levelLabel(run);
  bannerEl.className = `banner ${evaluation.passed ? 'pass' : 'fail'}`;
  bannerEl.textContent = evaluation.passed
    ? run.level
      ? `Level ${run.level} passed — all ${run.wordCount} words correct.`
      : `All ${run.wordCount} words correct.`
    : `Not passed yet — ${evaluation.correct} of ${run.wordCount} correct. Try again!`;

  renderStats([
    ['attempted', evaluation.attempted],
    ['correct', evaluation.correct],
    ['incorrect', evaluation.incorrect],
    ['points', evaluation.points],
  ]);
  renderReview(evaluation.results);

  // The next level only opens up once this one has been passed.
  nextLevelButton.hidden = !run.level || !evaluation.passed;
  retryButton.onclick = onRetry;
  nextLevelButton.onclick = onNextLevel;
  homeButton.onclick = onHome;

  showScreen('evaluation');
  return evaluation;
}

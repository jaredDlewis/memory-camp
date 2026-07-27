// Run state machine: setup → countdown → memorise → gap → recall → evaluation.

import { loadWordBank, pickWords } from './words.js';
import { saveAttempt } from './storage.js';
import * as setup from './screens/setup.js';
import * as interstitial from './screens/interstitial.js';
import * as memorize from './screens/memorize.js';
import * as recall from './screens/recall.js';
import * as evaluation from './screens/evaluation.js';
import * as results from './screens/results.js';

let run = null;

function stopEverything() {
  interstitial.stop();
  memorize.stop();
  recall.stop();
}

function goToSetup(round) {
  stopEverything();
  run = null;
  setup.show(round);
}

function goToResults() {
  stopEverything();
  run = null;
  results.show();
}

function startRun({ level, wordCount, settings }) {
  run = {
    level,
    wordCount,
    settings,
    words: pickWords(wordCount),
    answers: new Array(wordCount).fill(''),
    startedAt: new Date().toISOString(),
  };

  interstitial.start({
    text: 'Countdown to memorising!',
    seconds: settings.countdownSeconds,
    onComplete: beginMemorize,
  });
}

function beginMemorize() {
  memorize.start(run, () => {
    interstitial.start({
      text: 'There’s still some time until the reproduction stage!',
      seconds: run.settings.gapSeconds,
      onComplete: beginRecall,
    });
  });
}

function beginRecall() {
  recall.start(run, finishRun);
}

function finishRun() {
  const finished = run;
  const summary = evaluation.show(finished, {
    onRetry: () => startRun({ ...finished, settings: setup.getSettings() }),
    onNextLevel: () =>
      startRun({
        level: finished.level + 1,
        wordCount: (finished.level + 1) * setup.WORDS_PER_LEVEL,
        settings: setup.getSettings(),
      }),
    onHome: () => goToSetup(finished),
  });

  saveAttempt({
    date: finished.startedAt,
    level: finished.level,
    wordCount: finished.wordCount,
    attempted: summary.attempted,
    correct: summary.correct,
    points: summary.points,
    passed: summary.passed,
  });
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-nav]');
  if (!target) return;
  event.preventDefault();
  if (target.dataset.nav === 'results') goToResults();
  else goToSetup();
});

async function main() {
  try {
    await loadWordBank();
  } catch (error) {
    document.querySelector('main').innerHTML =
      `<p class="error">Could not load the word bank: ${error.message}. ` +
      'Serve this folder over HTTP (for example <code>python3 -m http.server 8000</code>) ' +
      'rather than opening the file directly.</p>';
    return;
  }

  setup.init({ onStart: startRun });
  goToSetup();
}

main();

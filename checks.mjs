// Checks for the browser-free parts of the app — grading, championship points,
// word selection and the countdown:  node checks.mjs
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

// The modules are written for the browser: words.js fetches the bank and
// timer.js listens for visibility changes. Both get a minimal stand-in here.
globalThis.fetch = async () => ({
  ok: true,
  status: 200,
  json: async () => JSON.parse(await readFile(join(root, 'wordBank.json'), 'utf8')),
});
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };

const { gradeAttempt, championshipPoints, gradeWord } = await import(`${root}/js/scoring.js`);
const { loadWordBank, pickWords, bankSize } = await import(`${root}/js/words.js`);

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` → got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
}

// --- grading -------------------------------------------------------------
check('exact match', gradeWord('heron', 'heron').status, 'correct');
check('case/space insensitive', gradeWord('heron', '  HERON '), { status: 'correct', correct: true });
check('typo not correct by default', gradeWord('despair', 'dispair'), { status: 'typo', correct: false });
check('typo correct when accepted', gradeWord('despair', 'dispair', { acceptTypos: true }), { status: 'typo', correct: true });
check('missing letter is a typo', gradeWord('helicopter', 'helicoter').status, 'typo');
check('extra letter is a typo', gradeWord('zinc', 'zinck').status, 'typo');
check('two edits is wrong', gradeWord('bugle', 'bugel').status, 'wrong');
check('blank', gradeWord('bugle', '   ').status, 'blank');

// --- championship points -------------------------------------------------
const results = (statuses) => statuses.map((status) => ({ status, correct: status === 'correct' }));

check('partial column, all correct', championshipPoints(results(Array(15).fill('correct'))), 15);
check('partial column, one mistake', championshipPoints(results([...Array(14).fill('correct'), 'wrong'])), 7);
check('partial column, two mistakes', championshipPoints(results([...Array(13).fill('correct'), 'wrong', 'wrong'])), 0);
check(
  'trailing blanks are not attempted',
  championshipPoints(results([...Array(10).fill('correct'), ...Array(5).fill('blank')])),
  10
);
check(
  'a gap before the last answer counts as a mistake',
  championshipPoints(results([...Array(9).fill('correct'), 'blank', ...Array(5).fill('correct')])),
  7
);
check('full column, all correct', championshipPoints(results(Array(20).fill('correct'))), 20);
check('full column, one mistake', championshipPoints(results([...Array(19).fill('correct'), 'wrong'])), 10);
check('full column, two mistakes', championshipPoints(results([...Array(18).fill('correct'), 'wrong', 'wrong'])), 0);
check(
  'two columns scored independently',
  championshipPoints(results([...Array(19).fill('correct'), 'wrong', ...Array(5).fill('correct')])),
  15
);

const attempt = gradeAttempt(['heron', 'zinc', 'bugle'], ['heron', '', 'bugle']);
check('attempt summary', [attempt.attempted, attempt.correct, attempt.incorrect, attempt.passed], [2, 2, 1, false]);
check('pass requires every word', gradeAttempt(['a', 'b'], ['a', 'b']).passed, true);

// --- word selection ------------------------------------------------------
await loadWordBank();
check('bank size', bankSize(), 1500);

const bank = JSON.parse(await readFile(`${root}/wordBank.json`, 'utf8'));
const category = (word) =>
  bank.concrete_nouns.includes(word) ? 'concrete' : bank.abstract_nouns.includes(word) ? 'abstract' : 'verb';

for (const count of [5, 15, 100, 1500]) {
  const words = pickWords(count);
  const mix = { concrete: 0, abstract: 0, verb: 0 };
  for (const word of words) mix[category(word)]++;
  check(`pickWords(${count}) size`, words.length, count);
  check(`pickWords(${count}) unique`, new Set(words).size, count);
  if (count === 100) check('pickWords(100) mix', mix, { concrete: 80, abstract: 10, verb: 10 });
  if (count === 1500) check('pickWords(1500) uses whole bank', mix, { concrete: 1200, abstract: 150, verb: 150 });
}

try {
  pickWords(1501);
  check('too many words rejected', 'no error', 'error');
} catch (error) {
  check('too many words rejected', error.message.includes('1500'), true);
}

// --- timer ---------------------------------------------------------------
const { createTimer, formatClock } = await import(`${root}/js/timer.js`);
check('formatClock', [formatClock(0), formatClock(59.2), formatClock(900)], ['00:00', '01:00', '15:00']);

let expired = false;
const timer = createTimer({ onExpire: () => (expired = true) });
timer.start(0.4);
await new Promise((resolve) => setTimeout(resolve, 700));
check('timer expires once elapsed', expired, true);
check('timer clamps at zero', timer.remainingSeconds(), 0);

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);

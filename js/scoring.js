// Grading a recall attempt.
//
// Two numbers come out of this: the plain count of correct words (which decides
// whether the level is passed) and championship points, scored the way a real
// competition scores the word discipline — in columns of 20.

export const COLUMN_SIZE = 20;

function normalize(word) {
  return String(word ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// Levenshtein distance, but it only ever needs to distinguish 0, 1 and "more
// than 1", so it bails out as soon as the best possible distance exceeds 1.
function isOneEditApart(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return false;

  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (shorter.length === longer.length) i++; // substitution
    j++; // insertion in the longer string
  }
  return edits + (longer.length - j) <= 1;
}

// status: 'correct' | 'typo' | 'wrong' | 'blank'.
// With acceptTypos on, a single-character slip counts as correct but is still
// labelled so the difference stays visible on the evaluation screen.
export function gradeWord(expected, answer, { acceptTypos = false } = {}) {
  const target = normalize(expected);
  const given = normalize(answer);

  if (given === '') return { status: 'blank', correct: false };
  if (given === target) return { status: 'correct', correct: true };
  if (isOneEditApart(given, target)) {
    return { status: 'typo', correct: Boolean(acceptTypos) };
  }
  return { status: 'wrong', correct: false };
}

// Championship points: split the list into columns of 20. A full column scores
// 20 with no mistakes, 10 with exactly one, and 0 with two or more. A trailing
// partial column is scored over the words actually attempted (up to the last
// non-blank answer), halved (rounded down) for one mistake and zeroed for two
// or more.
export function championshipPoints(results) {
  let points = 0;

  for (let start = 0; start < results.length; start += COLUMN_SIZE) {
    const column = results.slice(start, start + COLUMN_SIZE);
    const isFullColumn = column.length === COLUMN_SIZE;

    let attempted = column.length;
    if (!isFullColumn) {
      attempted = 0;
      for (let i = column.length - 1; i >= 0; i--) {
        if (column[i].status !== 'blank') {
          attempted = i + 1;
          break;
        }
      }
    }

    const scored = column.slice(0, attempted);
    const mistakes = scored.filter((result) => !result.correct).length;
    if (mistakes === 0) points += attempted;
    else if (mistakes === 1) points += Math.floor(attempted / 2);
  }

  return points;
}

export function gradeAttempt(words, answers, options = {}) {
  const results = words.map((word, index) => ({
    index,
    word,
    answer: String(answers[index] ?? '').trim(),
    ...gradeWord(word, answers[index], options),
  }));

  const correct = results.filter((result) => result.correct).length;
  const attempted = results.filter((result) => result.status !== 'blank').length;

  return {
    results,
    attempted,
    correct,
    incorrect: results.length - correct,
    points: championshipPoints(results),
    passed: correct === words.length,
  };
}

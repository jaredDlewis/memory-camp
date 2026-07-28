### Memory Camp

Inspired by [memocamp.com](https://memocamp.com/en), this application will provide free Random Word memorization training (memocamp is only free up to memorizing 15 words in 5 minutes).

## Running it

The app is plain static files — no build step, no dependencies — but it does need to be served over
HTTP (ES modules and `fetch` do not work from `file://`):

```bash
node serve.mjs
```

Then open <http://localhost:8000>. Any other static server works just as well, and the same files
can be deployed to GitHub Pages unchanged.

To run the checks for the browser-free logic (grading, points, word selection, the countdown):

```bash
node checks.mjs
```

## How a round works

`setup → 5s countdown → memorize → 10s gap → reproduction → evaluation`

- **Levels.** Level N gives you 5 × N words, with no upper limit; you pass a level by recalling
  every word correctly. Levels unlock one at a time — level N + 1 opens only once you have passed
  level N — so progress is tracked in your attempt history, and clearing that history resets it.
  A custom word count is always available for free practice at any size.
- **Memorize.** The full list is on the left, one word is in focus in the middle. Move with ← / →
  or space, or click any word to jump to it.
- **Reproduction.** Type each word back in order. Enter moves to the next slot, Shift+Enter back,
  and clicking a slot jumps to it. Both stages advance on their own when the timer runs out.
- **Evaluation.** Attempted / correct / incorrect, plus **championship points**, scored the way a
  competition scores this discipline: in columns of 20, where one mistake in a column halves it and
  two or more zero it. Each word is shown against your answer, with single-character slips marked
  separately from outright misses.
- **Timings** default to the competition setup (5s / 5 min / 10s / 15 min) and can be changed on
  the start screen; the settings and your attempt history are kept in the browser's local storage.

Journey points are intentionally not modelled — the journey lives in your head.

## Word Bank

- **Word Composition:** The word list is made up of 80% concrete nouns, 10% abstract nouns, and 10% verbs.
- **Verb Format:** Verbs are presented exactly as they are found in the dictionary, in their infinitive form (e.g., "walk" instead of "walking").
- **No Abbreviations:** The competition avoids abbreviations in favor of the full word (e.g., using "telephone" rather than "phone", or "refrigerator" rather than "fridge").
- **British English Standard:** Words that have different spellings in American and British English are generally avoided. If a distinction must be made, the British English equivalent is used. Words that only exist in American English (like "sidewalk" or "popsicle") are not used.
- **No Plurals:** General plurals are not included since they aren't standard dictionary entries (e.g., you will see "singer" but not "singers"). The only exception is for words that exclusively exist in plural form, such as "trousers," "scissors," or "pliers."

Each round samples that 80 / 10 / 10 mix from `wordBank.json` without repeats, so the rules above
are properties of the data — anything added to the bank has to follow them.

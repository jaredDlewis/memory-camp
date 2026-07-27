// Word selection for a training round.
//
// The bank in wordBank.json is already curated to competition rules (infinitive
// verbs, no abbreviations, British spelling, no general plurals), so selection
// only has to hit the right category mix — it does no filtering of its own.

const MIX = { concrete_nouns: 0.8, abstract_nouns: 0.1, verbs: 0.1 };

let bank = null;

export async function loadWordBank(url = 'wordBank.json') {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load word bank (${response.status})`);
  }
  bank = await response.json();
  for (const category of Object.keys(MIX)) {
    if (!Array.isArray(bank[category]) || bank[category].length === 0) {
      throw new Error(`Word bank is missing category "${category}"`);
    }
  }
  return bank;
}

export function bankSize() {
  if (!bank) return 0;
  return Object.keys(MIX).reduce((total, key) => total + bank[key].length, 0);
}

function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// How many words to take from each category. Abstract nouns and verbs round to
// their 10% share; concrete nouns absorb the remainder so the parts sum to
// `count`. If a category is too small to fill its share, the shortfall also
// falls to concrete nouns.
function categoryCounts(count) {
  const abstract = Math.min(Math.round(count * MIX.abstract_nouns), bank.abstract_nouns.length);
  const verbs = Math.min(Math.round(count * MIX.verbs), bank.verbs.length);
  const concrete = count - abstract - verbs;
  return { concrete_nouns: concrete, abstract_nouns: abstract, verbs };
}

export function pickWords(count) {
  if (!bank) throw new Error('Word bank has not been loaded yet');
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('Word count must be a positive whole number');
  }
  if (count > bankSize()) {
    throw new Error(`Only ${bankSize()} words are available in the bank`);
  }

  const counts = categoryCounts(count);
  if (counts.concrete_nouns > bank.concrete_nouns.length) {
    throw new Error(`Not enough concrete nouns for a round of ${count} words`);
  }

  const picked = [];
  for (const [category, take] of Object.entries(counts)) {
    picked.push(...shuffle(bank[category]).slice(0, take));
  }
  // Shuffle again so categories are interleaved rather than grouped.
  return shuffle(picked);
}

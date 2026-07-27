// Settings and attempt history, kept in localStorage. Every read is defensive:
// a corrupt or hand-edited key falls back to defaults rather than breaking the
// app, and a storage failure (private mode, quota) never interrupts a run.

const SETTINGS_KEY = 'memory-camp:settings';
const ATTEMPTS_KEY = 'memory-camp:attempts';
const MAX_ATTEMPTS = 500;

export const DEFAULT_SETTINGS = {
  countdownSeconds: 5,
  memorizeSeconds: 300,
  gapSeconds: 10,
  recallSeconds: 900,
  acceptTypos: false,
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function clampSeconds(value, fallback) {
  const seconds = Math.round(Number(value));
  if (!Number.isFinite(seconds) || seconds < 1) return fallback;
  return Math.min(seconds, 24 * 60 * 60);
}

export function loadSettings() {
  const stored = read(SETTINGS_KEY, {});
  const settings = { ...DEFAULT_SETTINGS };
  if (stored && typeof stored === 'object') {
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (!(key in stored)) continue;
      settings[key] =
        key === 'acceptTypos'
          ? Boolean(stored[key])
          : clampSeconds(stored[key], DEFAULT_SETTINGS[key]);
    }
  }
  return settings;
}

export function saveSettings(settings) {
  return write(SETTINGS_KEY, settings);
}

export function loadAttempts() {
  const stored = read(ATTEMPTS_KEY, []);
  if (!Array.isArray(stored)) return [];
  return stored.filter(
    (attempt) => attempt && typeof attempt === 'object' && typeof attempt.wordCount === 'number'
  );
}

export function saveAttempt(attempt) {
  const attempts = loadAttempts();
  attempts.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...attempt });
  write(ATTEMPTS_KEY, attempts.slice(0, MAX_ATTEMPTS));
  return attempts;
}

export function clearAttempts() {
  write(ATTEMPTS_KEY, []);
}

export function highestPassedLevel() {
  return loadAttempts().reduce(
    (best, attempt) =>
      attempt.passed && Number.isInteger(attempt.level) ? Math.max(best, attempt.level) : best,
    0
  );
}

// Levels unlock one at a time: you can train the next level up from the highest
// one you have passed, and level 1 is always available.
export function unlockedLevel() {
  return highestPassedLevel() + 1;
}

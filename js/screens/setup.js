// Setup screen: pick a level (or a custom word count), adjust timings, start.

import { bankSize } from '../words.js';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, unlockedLevel } from '../storage.js';
import { showScreen } from '../ui.js';

const levelInput = document.getElementById('level-input');
const lockNote = document.getElementById('level-lock-note');
const preview = document.getElementById('word-count-preview');
const customToggle = document.getElementById('custom-count-toggle');
const customField = document.getElementById('custom-count-field');
const customInput = document.getElementById('custom-count-input');
const errorEl = document.getElementById('setup-error');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-settings');

const settingInputs = {
  countdownSeconds: document.getElementById('setting-countdown'),
  memorizeSeconds: document.getElementById('setting-memorize'),
  gapSeconds: document.getElementById('setting-gap'),
  recallSeconds: document.getElementById('setting-recall'),
  acceptTypos: document.getElementById('setting-typos'),
};

const MINUTE_FIELDS = new Set(['memorizeSeconds', 'recallSeconds']);
export const WORDS_PER_LEVEL = 5;

let settings = loadSettings();
let onStart = null;

export function getSettings() {
  return { ...settings };
}

function readSettingsFromForm() {
  const next = { ...settings };
  for (const [key, input] of Object.entries(settingInputs)) {
    if (key === 'acceptTypos') {
      next[key] = input.checked;
      continue;
    }
    const value = Number(input.value);
    if (!Number.isFinite(value) || value <= 0) continue;
    next[key] = MINUTE_FIELDS.has(key) ? Math.round(value * 60) : Math.round(value);
  }
  settings = next;
  saveSettings(settings);
}

function writeSettingsToForm() {
  for (const [key, input] of Object.entries(settingInputs)) {
    if (key === 'acceptTypos') {
      input.checked = settings[key];
    } else {
      input.value = MINUTE_FIELDS.has(key) ? +(settings[key] / 60).toFixed(2) : settings[key];
    }
  }
}

function usingCustomCount() {
  return !customField.hidden;
}

function plannedRound() {
  if (usingCustomCount()) {
    const wordCount = Math.round(Number(customInput.value));
    return { level: null, wordCount };
  }
  const level = Math.round(Number(levelInput.value));
  return { level, wordCount: level * WORDS_PER_LEVEL };
}

function refreshPreview() {
  const { wordCount } = plannedRound();
  preview.textContent = Number.isFinite(wordCount) && wordCount > 0 ? `${wordCount} words` : '—';

  const unlocked = unlockedLevel();
  levelInput.max = unlocked;
  lockNote.hidden = usingCustomCount();
  lockNote.textContent =
    unlocked === 1
      ? 'Level 1 is unlocked. Pass a level to unlock the next one.'
      : `Levels 1–${unlocked} unlocked. Pass level ${unlocked} to unlock level ${unlocked + 1}.`;
}

function showError(message) {
  errorEl.textContent = message ?? '';
  errorEl.hidden = !message;
}

function start() {
  const round = plannedRound();
  const max = bankSize();

  if (!Number.isInteger(round.wordCount) || round.wordCount < 1) {
    showError('Choose a whole number of words greater than zero.');
    return;
  }
  if (round.wordCount > max) {
    showError(`The word bank only holds ${max} words.`);
    return;
  }
  if (!usingCustomCount()) {
    if (!Number.isInteger(round.level) || round.level < 1) {
      showError('Choose a level of 1 or higher.');
      return;
    }
    const unlocked = unlockedLevel();
    if (round.level > unlocked) {
      showError(
        `Level ${round.level} is locked — pass level ${unlocked} first. ` +
          'A custom word count is always available for free practice.'
      );
      return;
    }
  }

  showError(null);
  readSettingsFromForm();
  if (onStart) onStart({ ...round, settings: getSettings() });
}

export function init(handlers) {
  onStart = handlers.onStart;
  writeSettingsToForm();
  refreshPreview();
}

export function show(round) {
  if (round?.level) {
    customField.hidden = true;
    levelInput.value = round.level;
  } else if (round?.wordCount) {
    customField.hidden = false;
    customInput.value = round.wordCount;
  }
  levelInput.value = Math.min(Math.max(Math.round(Number(levelInput.value)) || 1, 1), unlockedLevel());
  showError(null);
  writeSettingsToForm();
  refreshPreview();
  showScreen('setup');
}

levelInput.addEventListener('input', refreshPreview);
customInput.addEventListener('input', refreshPreview);

customToggle.addEventListener('click', () => {
  const goingCustom = customField.hidden;
  if (goingCustom) {
    // Seed the custom field from the level currently selected.
    customInput.value = plannedRound().wordCount || WORDS_PER_LEVEL;
  }
  customField.hidden = !goingCustom;
  customToggle.textContent = goingCustom ? 'go back to levels' : 'use a custom word count';
  refreshPreview();
});

for (const input of Object.values(settingInputs)) {
  input.addEventListener('change', readSettingsFromForm);
}

resetButton.addEventListener('click', () => {
  settings = { ...DEFAULT_SETTINGS };
  saveSettings(settings);
  writeSettingsToForm();
});

startButton.addEventListener('click', start);

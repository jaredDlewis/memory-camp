// Small shared DOM helpers: screen switching, the countdown clock, and the
// column-of-20 word list used by the memorise, recall and evaluation screens.

import { COLUMN_SIZE } from './scoring.js';
import { formatClock } from './timer.js';

export function showScreen(name) {
  for (const section of document.querySelectorAll('.screen')) {
    section.hidden = section.id !== `screen-${name}`;
  }
  window.scrollTo({ top: 0 });
}

export function updateClock(element, seconds) {
  element.textContent = formatClock(seconds);
  element.classList.toggle('urgent', seconds <= 10);
}

export function levelLabel(run) {
  const words = `${run.wordCount} word${run.wordCount === 1 ? '' : 's'}`;
  return run.level ? `level ${run.level} · ${words}` : words;
}

// Builds the list as competition columns of 20. `renderItem(li, index)` fills
// each row; `onSelect` receives the index of a clicked row.
export function renderColumns(container, count, renderItem, { onSelect } = {}) {
  container.textContent = '';

  for (let start = 0; start < count; start += COLUMN_SIZE) {
    const column = document.createElement('ul');
    column.className = 'word-column';
    for (let index = start; index < Math.min(start + COLUMN_SIZE, count); index++) {
      const item = document.createElement('li');
      item.dataset.index = String(index);
      renderItem(item, index);
      column.append(item);
    }
    container.append(column);
  }

  container.onclick = onSelect
    ? (event) => {
        const item = event.target.closest('li[data-index]');
        if (item && container.contains(item)) onSelect(Number(item.dataset.index));
      }
    : null;
}

export function itemAt(container, index) {
  return container.querySelector(`li[data-index="${index}"]`);
}

export function setActiveItem(container, index) {
  for (const item of container.querySelectorAll('li.active')) {
    item.classList.remove('active');
  }
  const item = itemAt(container, index);
  if (item) {
    item.classList.add('active');
    item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

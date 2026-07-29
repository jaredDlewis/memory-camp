/* Deck runtime: nothing here knows about the content of a slide, only about
   the scaffold. Add or remove <section class="slide"> in index.html and the
   counter, the dot rail, the reveals and the keyboard nav all follow. */

const slides = [...document.querySelectorAll('.slide')];
const hud = {
  index: document.querySelector('.hud-index'),
  total: document.querySelector('.hud-total'),
};
const progressFill = document.querySelector('.progress-fill');
const dotRail = document.querySelector('.dots');

const pad = (n) => String(n).padStart(2, '0');

/* ---------- ids, so a slide can be linked to directly ---------- */

slides.forEach((slide, i) => {
  if (!slide.id) slide.id = `slide-${i + 1}`;
});

/* ---------- stagger: each revealed element waits its turn ---------- */

slides.forEach((slide) => {
  slide.querySelectorAll('[data-reveal]').forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 60, 300)}ms`;
  });
});

/* ---------- dot rail ---------- */

slides.forEach((slide, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.dataset.target = String(i);
  dot.setAttribute('aria-label', `${slide.dataset.label || 'Slide'} — slide ${i + 1}`);
  dotRail.append(dot);
});

const dots = [...dotRail.children];

dotRail.addEventListener('click', (e) => {
  const dot = e.target.closest('button');
  if (dot) goTo(Number(dot.dataset.target));
});

/* ---------- which slide is current ---------- */

let current = 0;
/* Where navigation thinks we are *or are heading*. During a jump the observer
   has not caught up yet, so navigating off `current` would re-target the slide
   already being scrolled to and swallow the second gesture. */
let navIndex = 0;

function setCurrent(index) {
  current = index;
  navIndex = index;
  slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
  dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
  hud.index.textContent = pad(index + 1);
}

hud.total.textContent = pad(slides.length);

/* A slide becomes current once its middle band crosses the middle of the
   viewport, which keeps the counter in step with what is actually being read. */
const observer = new IntersectionObserver(
  (entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .forEach((e) => setCurrent(slides.indexOf(e.target)));
  },
  { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
);

slides.forEach((s) => observer.observe(s));
setCurrent(0);

/* ---------- progress rail ---------- */

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  progressFill.style.width = `${Math.min(Math.max(ratio, 0), 1) * 100}%`;
}

addEventListener('scroll', updateProgress, { passive: true });
addEventListener('resize', updateProgress);
updateProgress();

/* ---------- navigation ---------- */

function goTo(index) {
  const clamped = Math.min(Math.max(index, 0), slides.length - 1);
  navIndex = clamped;
  slides[clamped].scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const NEXT = new Set(['ArrowDown', 'ArrowRight', 'PageDown', ' ', 'Enter']);
const PREV = new Set(['ArrowUp', 'ArrowLeft', 'PageUp']);

addEventListener('keydown', (e) => {
  // Let the browser have the key when the user is typing or has a control
  // focused — including inside the embedded app.
  const el = document.activeElement;
  if (el && el.closest('input, textarea, select, iframe, [contenteditable]')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (NEXT.has(e.key)) {
    e.preventDefault();
    goTo(navIndex + 1);
  } else if (PREV.has(e.key)) {
    e.preventDefault();
    goTo(navIndex - 1);
  } else if (e.key === 'Home') {
    e.preventDefault();
    goTo(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    goTo(slides.length - 1);
  }
});

/* ---------- one slide per scroll gesture ---------- */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* The slack absorbs a slide that overruns by a hair of padding — losing that
   is harmless, and it keeps one stray pixel from costing the deck its snap. */
const SLACK = 24;

const fits = (slide) => slide.getBoundingClientRect().height <= innerHeight + SLACK;

/* Mandatory snapping is only safe while every slide fits on screen — see the
   note in base.css. Re-checked whenever the layout could have changed. */
function refreshSnapMode() {
  const safe = !reduceMotion.matches && slides.every(fits);
  document.documentElement.classList.toggle('snap-hard', safe);
}

addEventListener('resize', refreshSnapMode);
addEventListener('load', refreshSnapMode);
reduceMotion.addEventListener('change', refreshSnapMode);
refreshSnapMode();

const STEP_MS = 460; // how long one jump owns the scroller
const GAP_MS = 120; // silence long enough to count as a new gesture

let lastWheelAt = 0;
let lastDelta = 0;
let lastJumpAt = 0;

addEventListener(
  'wheel',
  (e) => {
    if (reduceMotion.matches) return;
    if (e.ctrlKey) return; // pinch-zoom, not a scroll
    const delta = Math.abs(e.deltaY);
    if (delta <= Math.abs(e.deltaX)) return; // sideways: let the code block have it

    // A slide taller than the window has to be readable, so it keeps native
    // scrolling until the reader reaches its end.
    const slide = slides[current];
    if (!slide || !fits(slide)) return;

    e.preventDefault();

    const now = performance.now();
    // A flick's momentum tail only ever decays, so what separates one gesture
    // from the next is either a pause or a fresh push against the wheel.
    const newGesture = now - lastWheelAt > GAP_MS || delta > lastDelta + 2;
    lastWheelAt = now;
    lastDelta = delta;

    if (!newGesture || now - lastJumpAt < STEP_MS) return;
    lastJumpAt = now;
    goTo(navIndex + (e.deltaY > 0 ? 1 : -1));
  },
  { passive: false },
);

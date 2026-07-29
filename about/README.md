### about/ — the Memory Camp talk

A scroll-through deck on the Stanford study, run at the Max Planck Institute of
Psychiatry in Munich, that put 51 people through six weeks of memory training —
and on what to do with the result. Static files only, same as the app, so GitHub
Pages serves it at `/<repo>/about/` with no build step. Every path in here is
relative, so it works the same locally and under the Pages sub-path.

Serve the repo root and open <http://localhost:8000/about/>:

```bash
node serve.mjs
```

## Structure

```
about/
  index.html      every slide, one <section class="slide"> each
  css/base.css    tokens (shared with the app), type, placeholder styling
  css/slides.css  the scaffold + one block per slide type
  css/responsive.css  narrow screens, print/PDF, reduced motion
  js/main.js      counter, dot rail, progress, reveals, keyboard nav
  assets/         images, screenshots, charts
```

## The deck

Fourteen slides: the study design, the recall protocol, the baseline, the
three-way split, the two result charts, what the mnemonic group actually did
every day, a live pass at the app, and the route-building steps to start on.

Nothing is numbered by hand, so the counter, the dot rail and the reveal order
all re-derive themselves. To add a slide, copy a `<section>` and give it a
`data-label` — that label is what prints down the left gutter and what the dot
rail announces. Anything marked `data-reveal` fades up when its slide becomes
current, staggered in source order.

Slide types available (`slide-code` is styled but unused in the current deck):

| class | what it's for |
| --- | --- |
| `slide-title` | opener: kicker, headline, one-line summary, byline |
| `slide-statement` | one big line on its own (the hook, the turn) |
| `slide-split` | copy beside a visual; add `mirrored` to flip the columns |
| `slide-steps` | an auto-numbered sequence of beats |
| `slide-media` | a full-width screenshot or chart with a caption |
| `slide-stats` | a row of numbers |
| `slide-quote` | a pull-out quote with attribution |
| `slide-demo` | the real app in an iframe (`../index.html`) |
| `slide-code` | a snippet plus a line about it |
| `slide-close` | closing line and links |

Two blocks sit inside those slides:

- `.factlist` — a `<dl>` of labelled facts, for the panel on a split slide.
- `.bars` — the result charts. Every bar is a fraction of the same 72-word
  ceiling, so the three rows compare directly and the empty space to the right
  carries meaning. Each row holds a `.seg-base` (what the group could already
  do) and a `.seg-gain` (what six weeks added); both take their length from a
  `--n` word count set inline, and both grow from zero once the slide is
  current. Change a number in the markup and the chart follows.

## Presenting

One scroll gesture moves exactly one slide — a flick advances once and its
momentum is ignored, so you can't overshoot mid-talk. Holding a sustained scroll
keeps stepping at about a slide every 0.6s.

- <kbd>↓</kbd> <kbd>→</kbd> <kbd>Space</kbd> <kbd>PageDown</kbd> — next slide
- <kbd>↑</kbd> <kbd>←</kbd> <kbd>PageUp</kbd> — previous slide
- <kbd>Home</kbd> / <kbd>End</kbd> — first / last
- the dots on the right jump anywhere; every slide also has an `#slide-N` anchor

Keys are handed back to the page whenever focus is in a field or in the embedded
app, so the live demo stays usable mid-talk. If a slide ever grows taller than
the window — a short laptop screen, a lot of added copy — that slide reverts to
ordinary scrolling so nothing ends up stranded below the fold.

Print to PDF for a handout — each slide breaks onto its own page and the reveals
are forced visible.

# Emily's Study Sanctuary 🌿

A cozy, calm study companion built for focus — designed ADHD-first: low friction
to start, and progress you can _see_ and feel.

A single-page app (Vite + React + Tailwind) with three widgets:

- **The Book Nook** — a notebook-paper "current reads" list (one field + Enter to
  add, checkbox to strike through, persists in `localStorage`).
- **The Pomodoro** — a 25-min focus / 5-min rest timer with a depleting
  SVG ring, a leaf counter for banked sessions, and a soot sprite that naps while
  you work and wakes with mail (a quote) when the timer finishes.
- **The Mind's Garden** — "Water the Mind" grows a plant from a pure-CSS
  terracotta pot and shows a little fact.

Everything is built from CSS, Tailwind, CSS shapes, and emoji — no image or icon
files, so nothing can ever show as broken. Ambient motion is pure CSS and pauses
under `prefers-reduced-motion`.

## Run it

```bash
npm install && npm run dev
```

Then open the printed local URL (default http://localhost:5173/).

## Build

```bash
npm run build && npm run preview
```

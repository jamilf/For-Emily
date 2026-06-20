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

## Cloud sync & email sign-in (Supabase)

Sign-in uses a **6-digit email code** (OTP) — type the code from the email into
the app. No password, no link to click.

If the email shows a **link pointing at `http://localhost:3000`**, that comes from
the **Supabase project settings**, not this app (the code never references
`localhost:3000`). Fix it in the Supabase dashboard for project
`tbaiekqecfqdgeppxmst`:

1. **Authentication → URL Configuration**
   - **Site URL:** `https://foremilytran.com`
   - **Redirect URLs:** add `https://foremilytran.com/**` and `http://localhost:5173/**`
2. **Authentication → Email Templates → "Magic Link"** — show the code instead of
   a link, e.g.:

   ```
   <h2>Your sign-in code</h2>
   <p>Enter this code in Emily's Study Sanctuary:</p>
   <p style="font-size:24px;font-weight:bold;letter-spacing:3px">{{ .Token }}</p>
   ```

   `{{ .Token }}` is the 6-digit OTP the app asks for.

On the app side, `signInWithOtp` already sends `emailRedirectTo: window.location.origin`,
so once the redirect allow-list above includes the site, any link also lands on
the real origin (never `localhost:3000`), and `detectSessionInUrl` completes
sign-in if the link is clicked.

Optional overrides via env (see `.env.example`): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`.

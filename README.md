# 🎬 Surreel

A personal, cross-device-synced log of every movie you see in theaters — with **AMC A-List savings tracking**, deep stats, and a cinematic feel.

Built with **React + Vite + TypeScript + Tailwind**, **Supabase** (Auth, Postgres, RLS, Realtime), the **TMDB API** (proxied server-side), and deployed on **Cloudflare Pages**.

---

## What's inside

Four bottom tabs + Settings:

1. **Home** — `A-List Savings So Far` hero with a savings-% ring, a stat grid (Ticket Value, Membership Paid, Cost Per Movie, Cost Per Hour, Movies/Hours Watched), and previews into four analytics drill-downs.
2. **Movies** — the screening log: search, an Upcoming group, and screenings grouped by year. Floating **+** to add.
3. **Screens** — browse **By Format** / **By Theater**, each a first-class entity with its own stats and a drill-down list.
4. **Rewind** — a shareable year-in-review recap.

Analytics pages: **How I Spend**, **What I Watch**, **Where I Watch**, **When I Watched** (incl. a day × time-of-day heatmap). A global **period switcher** (`‹ Week / Month / Year / All Time ›`) governs every stats + savings surface.

### Deterministic savings engine
Every figure traces to summed rows or a fixed formula — no estimates. Money is computed in integer cents.

```
gross_ticket_value = Σ ticket_value over screenings in period
membership_paid    = Σ membership_charges.amount in period
net_savings        = gross_ticket_value − membership_paid     ← headline
pct_savings        = net_savings / gross_ticket_value
bonus_fees_saved   = Σ fees_saved                             ← tracked separately
cost_per_movie     = membership_paid / count(movies)
cost_per_hour      = membership_paid / (Σ runtime_min / 60)
break_even         = gross_ticket_value ≥ membership_paid
```

Charges are auto-generated on each program's `billing_day` (idempotently), resolved from a maintained **AMC-A-List-by-state price table** when historical state pricing is enabled, else from a manual `monthly_fee`. Pause / resume and manual entry are supported.

---

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in `supabase/migrations/` (in order) via the SQL editor or the Supabase CLI:
   ```bash
   supabase db push        # or paste 0001_init.sql then 0002_seed_amc_prices.sql
   ```
   This creates the schema, **RLS scoped to `auth.uid()`** on every table, Realtime publication, and seeds AMC A-List state pricing.
3. In **Authentication → Providers**, enable **Email (magic link)** and **Google** OAuth. Add your deployed origin to the redirect allow-list.

### 2. TMDB
Get a free API key at [themoviedb.org](https://www.themoviedb.org/settings/api) (v3 key or v4 read token both work).

### 3. Environment
Copy `.env.example` → `.env` and fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
TMDB_API_KEY=...          # server-only — never exposed to the browser
```

### 4. Run locally
```bash
npm install
npm run dev          # http://localhost:5173
```
In dev, `/api/tmdb/*` is proxied to TMDB by Vite (using `TMDB_API_KEY` from your shell/`.env`). In production the Cloudflare Pages Function in `functions/api/tmdb/` does the same — the key stays server-side either way.

---

## Deploy to Cloudflare Pages

1. Push this repo to GitHub and create a Pages project from it.
2. **Build settings:** build command `npm run build`, output directory `dist`.
3. **Environment variables** (Production + Preview):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — build-time, baked into the client bundle (public keys; safe).
   - `TMDB_API_KEY` — runtime secret used by the Pages Function only.
4. The `/functions` directory is auto-detected: `/api/tmdb/*` becomes the TMDB proxy. `public/_redirects` provides the SPA fallback for client-side routes.

---

## Project structure

```
functions/api/tmdb/[[path]].ts   TMDB proxy (Cloudflare Pages Function)
supabase/migrations/             Schema + RLS + AMC price seed
src/
  lib/        supabase client, tmdb client, types, money + period helpers
  engine/     savings.ts · charges.ts · stats.ts   (deterministic, pure)
  state/      auth · data (fetch + realtime sync) · period contexts
  components/ ui primitives + dependency-free SVG charts
  pages/      Home · Movies · Screens · Rewind · Settings · AddEditScreening
              analytics/ (How I Spend · What I Watch · Where I Watch · When I Watched)
```

## Notes
- **Strict TypeScript**, no `any` on data models.
- All money math in integer cents; figures derive only from rows or the fixed formulas.
- Below threshold, stats render **"Insufficient data"** rather than inventing a value.
- Every row is RLS-scoped to `auth.uid()`, so a single account syncs across devices via Supabase Realtime.

# Surreel — Project Handoff & Planning Brief

> Paste this into a Claude chat to plan further. It's self-contained: it assumes
> no prior context. Last updated 2026-06-20.

---

## 1. What this is

**Surreel** is a personal, cross-device-synced web app for logging every
movie you see *in theaters*, with a deterministic **AMC A-List savings tracker**
and deep stats, in a cinematic-but-premium UI. Single account today (RLS-scoped
so it can expand to multi-user later).

It exists as a working codebase at `/Users/mo/Downloads/reel-ledger` (React +
Vite + TypeScript). It builds clean, runs locally, and ships with a demo dataset
so it looks alive before any backend is wired.

**Core value:** every displayed number traces to summed rows or a fixed formula —
no estimates. The headline is "A-List Savings So Far" = (what tickets would have
cost) − (what the membership cost), period-aware.

---

## 2. Current status (what's real right now)

| Area | State |
|---|---|
| Build / typecheck | ✅ Green (strict TS, no `any` on data models) |
| Design system | ✅ **Apple-grade** look locked & implemented (see §5) |
| Demo data | ✅ Loads automatically when Supabase isn't configured; in-memory CRUD works |
| Home dashboard + savings engine | ✅ Working, period-aware |
| 4 analytics pages | ✅ How I Spend / What I Watch / Where I Watch / When I Watched |
| Movies log (search, upcoming, year groups) | ✅ |
| Add/Edit screening (TMDB autocomplete) | ✅ (TMDB needs a key to actually search) |
| Screens (By Format / By Theater) | ✅ |
| Membership engine (charges, pause, manual, ledger) | ✅ |
| Rewind (year-in-review) | ✅ basic version |
| Supabase wired to real project | ⛔ Not yet — runs in demo mode |
| TMDB key configured | ⛔ Not yet — autocomplete/posters inert until set |
| Deployed | ⛔ Not yet (Cloudflare Pages target, config ready) |

**Run it:** `cd reel-ledger && npm install && npm run dev` → http://localhost:5173
(shows demo data). Add `.env` (see `.env.example`) to go live.

---

## 3. Tech stack (fixed — do not substitute)

- **React + Vite + TypeScript + Tailwind CSS**
- **Supabase** — Auth (email magic link + Google OAuth), Postgres, Row-Level
  Security, Realtime (cross-device sync)
- **TMDB API** — movie metadata + posters, **proxied server-side** (key never
  client-side) via a Cloudflare Pages Function (`functions/api/tmdb/[[path]].ts`)
  and the Vite dev proxy
- **Deploy target: Cloudflare Pages**

---

## 4. App structure (IA)

Four bottom tabs + Settings:
1. **Home** — savings hero (net savings + %-ring) + stat grid + previews into 4
   analytics drill-downs.
2. **Movies** — the screening log: search, Upcoming group, grouped by year,
   floating **+**.
3. **Screens** — browse **By Format** / **By Theater**, each a first-class entity
   with its own stats + drill-down.
4. **Rewind** — shareable year-in-review.

Global **period switcher** `‹ Week / Month / Year / All Time ›` governs every
stats + savings surface.

---

## 5. Design direction (LOCKED)

Earlier dark/amber + neon directions were rejected as "cheap / not premium."
Chosen anchor: **Apple TV / Apple** — premium, calm, near-monochrome.

- **Type:** real **SF Pro** via the system font stack. Tight tracking on big
  numbers. Not uppercase.
- **Surfaces:** **frosted glass** — translucent white-on-black cards with
  `backdrop-blur` floating over a soft ambient glow (indigo/blue top, faint green
  bottom). Depth via layering, not borders.
- **Color:** near-monochrome chrome (white + Apple's tuned label greys:
  `#F5F5F7` / 60% / 30% on `#000`). Color is *earned*: Apple **system blue** =
  interactive accent, **green→mint** = savings/positive, blue/indigo/teal/orange
  for charts. No amber, no neon.
- **Controls:** iOS segmented control; floating frosted glass tab bar (white
  active state).
- Tailwind token *names* were kept (`amber`, `bone`, `ink`, `velvet`) but remapped
  to Apple values (`amber`→system blue, `velvet`→system red) so markup didn't
  churn. A future cleanup could rename them to semantic tokens.

There are 4 throwaway mockup files in the repo root (`theme-preview.html`,
`theme-apple.html`, etc.) — not part of the build; safe to delete.

---

## 6. Data model (Postgres; see `supabase/migrations/0001_init.sql`)

All money stored as `numeric(10,2)` dollars; the engine computes in **integer
cents**. Every user table is **RLS-scoped to `auth.uid()`**.

- **screenings** — tmdb metadata snapshot (title, poster/backdrop, year, runtime,
  director, mpaa, genres[]), theater_id, screen_format (Standard|IMAX|Dolby|
  RealD3D|PLF|ScreenX|Other), format_details, is_3d, is_plf,
  membership_program_id, auditorium, seat, showtime, **is_upcoming**,
  ticket_value, fees_saved (def 2.99), concessions_spend, misc_spend,
  additional_tickets, additional_tickets_cost, rating, tags[], notes.
- **theaters** — name, chain (AMC|Regal|Other), city, state.
- **membership_programs** — name, use_historical_state_pricing, state,
  billing_day (1–31), monthly_fee, is_paused, start_date.
- **membership_charges** — program_id, charge_date, amount, source
  (auto|manual|onboarding); unique(program_id, charge_date).
- **amc_alist_state_prices** — maintained global reference (state, effective_from,
  monthly_price, tier); seeded in `0002_seed_amc_prices.sql`.

---

## 7. Savings engine (deterministic — the heart of the app)

`src/engine/savings.ts`, period-filtered. All in cents.

```
gross_ticket_value = Σ ticket_value over SEEN screenings in period
membership_paid    = Σ membership_charges.amount in period
net_savings        = gross_ticket_value − membership_paid     ← headline
pct_savings        = net_savings / gross_ticket_value
bonus_fees_saved   = Σ fees_saved                             ← shown separately
cost_per_movie     = membership_paid / count(movies)
cost_per_hour      = membership_paid / (Σ runtime_min / 60)
break_even         = gross_ticket_value ≥ membership_paid
```

Spend donut buckets: Subscriptions (`membership_paid`), Concessions, Extra
Tickets, Misc.

**Charge generation** (`src/engine/charges.ts`): on each program's `billing_day`,
idempotently create charges from start→today (onboarding charge for the start
month). Amount resolves from the AMC-by-state table when historical pricing is on,
else `monthly_fee`. Paused ⇒ no new charges; un-pause resets the cycle to today
and adds a charge. **Runs client-side on load today** (a deliberate choice for a
no-always-on-backend personal app).

Stats engine (`src/engine/stats.ts`) computes the 4 analytics pages. Below a
threshold, stats render **"Insufficient data"** rather than inventing a value.
Streaks are currently **weekly** (A-List cadence).

---

## 8. File map (orientation)

```
functions/api/tmdb/[[path]].ts    TMDB proxy (Cloudflare Pages Function)
supabase/migrations/              0001 schema+RLS+realtime · 0002 AMC price seed
src/
  lib/        supabase · tmdb · types · format(money) · period · demo(sample data)
  engine/     savings.ts · charges.ts · stats.ts   (pure, deterministic)
  state/      auth · data(fetch+realtime+CRUD, demo branch) · period contexts
  components/ ui/(primitives, charts, PeriodSwitcher) · screening/(TmdbSearch)
  pages/      Home · Movies · Screens · Rewind · Settings · AddEditScreening
              analytics/(HowISpend · WhatIWatch · WhereIWatch · WhenIWatched)
```

---

## 9. Known gaps / decisions to revisit

1. **Supabase not wired** — need a real project, run both migrations, enable
   Email + Google auth, set redirect URLs.
2. **TMDB key** — search/posters inert until `TMDB_API_KEY` is set (server-side).
3. **Charge generation is client-side** — could move to a Supabase scheduled
   function/cron for true server-driven billing. Tradeoff: complexity vs.
   always-correct-without-app-open.
4. **Streak semantics** — currently weekly; could offer daily or configurable.
5. **Token naming** — `amber`/`velvet` now mean blue/red; a rename pass would aid
   maintainability.
6. **Rewind** is basic — could become richer shareable cards / image export.
7. **No tests yet** — the engines (savings/charges/stats) are pure and ripe for
   unit tests.
8. **Demo posters are placeholders** — real posters appear once TMDB is live.
9. **Accessibility / keyboard nav / reduced-motion** not yet audited.
10. **PWA / offline / install** not set up (could matter for a phone-first log).

---

## 10. Good planning questions to bring to chat

- **Scope & sequence:** ship a real synced MVP first (wire Supabase+TMDB+deploy),
  or keep polishing UX before going live?
- **Pricing accuracy:** how exact must the AMC-by-state historical price table be?
  Source of truth? Auto-update strategy?
- **Data entry friction:** is manual logging acceptable, or do we want
  ticket/email parsing, AMC account import, calendar integration, etc.?
- **Multi-program reality:** A-List + Regal Unlimited simultaneously? Family/guest
  tickets? Non-membership visits already supported.
- **Rewind ambitions:** how shareable (image export, public link)?
- **Platform:** is web-on-phone enough, or is a real iOS app the eventual goal
  (the spec was inspired by an iOS app's IA)?
- **Monetization / audience:** purely personal, or productize for other A-List
  members? (Changes auth, onboarding, pricing-data maintenance.)

---

## 11. Constraints to preserve (from the original spec)

- Strict TypeScript; no `any` on data models.
- No fabricated stats — every figure derives from rows or the fixed formulas.
- Period switcher governs all stats/savings.
- Mobile + desktop responsive.
- TMDB key never exposed client-side.
- RLS on all tables; everything scoped to `auth.uid()`.
- Money math in integer cents.

# Surreel − Changelog

Curated ship log, newest first. The repo is canonical: read from a fresh
clone, prepend new entries under the header, never rewrite or reorder
existing ones.

## 2026-06-24 − screen-format-check (fix)
(this push)
- Fix: editing/adding a screening with format "Prime at AMC" silently failed to save — the live DB still had the 0001 single-quoted screen_format CHECK
  enum, which did not include the new value, so the UPDATE/INSERT was rejected.
- Migration 0005_drop_screen_format_check: drops constraint screenings_screen_format_check. screen_format is now enforced app-side only
  (ScreenFormat union), per project rules — future formats need no migration.
- DB only; no code change. Adding formats app-side is now sufficient.

## 2026-06-24 − prime-format
(this push)
- New screen format: "Prime at AMC" added to the ScreenFormat union and SCREEN_FORMATS, so it appears in the Add/Edit format picker and flows
  through formatMix / Rewind automatically.
- ticketValue: Prime at AMC gets a +5 retail upcharge (same tier as Dolby) and is excluded from the standalone PLF-toggle double-count.
- Files: src/lib/types.ts, src/lib/ticketValue.ts. No migration (screen_format is app-enforced free text).

## 2026-06-23 − inapp-brand
(this push)
- Header: the placeholder circle-dot + system-font Surreel is replaced with
  the gold reel mark + the GT Sectra Surreel wordmark (outlined SVG, no font
  file). Loading splash uses the same wordmark.
- New: src/components/ui/brand.tsx exporting ReelMark + Wordmark, both
  verbatim v7 geometry (reel e0f28d2d, wordmark 20dd3299), fill currentColor.
- Files: src/App.tsx, src/components/ui/brand.tsx. No migration.

## 2026-06-23 − monogram-icons
(this push)
- Favicon / app-icon / PWA: replaced the legacy reel.svg favicon with the
  Surreel S-monogram set (GT Sectra S, gold reel jewel, teal plus). Favicon
  uses the S-only reduction for tab legibility; app / PWA / apple-touch use
  the full monogram.
- Added under public/: favicon.svg, favicon.ico, favicon-16.png,
  favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png,
  icon-192-maskable.png, icon-512-maskable.png, site.webmanifest.
- index.html: repointed icon links, added apple-touch + manifest,
  theme-color -> #02060F.
- Brand: every mark derives verbatim from the v7 lockup (icon / reel /
  S-glyph hash-matched). No app code, no migration.

## 2026-06-23 − booked-label
(this push)
- Movies: the upcoming section header now reads "Booked" − these are confirmed tickets, not a wishlist.
- Add/Edit: the not-seen-yet toggle now reads "Booked — not seen yet" (was "Planned (upcoming)").
- Files: src/pages/Movies.tsx, src/pages/AddEditScreening.tsx. No migration.

## 2026-06-22 − dedupe-theaters
(this push)
- addTheater now reuses an existing theater when a normalized name + city +
  state match, instead of inserting a new row on every autocomplete pick.
- Prevents new duplicate theaters; existing dupes still need a one-time
  manual merge in the Supabase Table Editor.
- Files: src/state/data.tsx. No migration.

## 2026-06-22 − fees-tile
(this push)
- Home: moved waived fees out of the hero pill into a dedicated Fees Waived
  line below the stat grid, keeping the bonus stat separate from net savings.
- Nav: inactive bottom-nav labels bumped from bone-faint to bone-dim for
  legibility.
- Files: src/pages/Home.tsx, src/App.tsx. No migration.

## 2026-06-22 − recent
(this push)
- Home: Recently watched strip − the last 3 in-period screenings
  (poster, title, theater · date, saved), each linking to its detail page.
- Engine: added screeningSavedCents() to savings.ts (pure, integer cents).
- Files: src/pages/Home.tsx, src/engine/savings.ts. No migration.

## 2026-06-22 − reel-reads
(this push)
- Home: a plain-English takeaway under each Reel Story card (How I Spend /
  What I Watch / Where I Watch / When I Watched).
- New Best Value card: the single screening with the highest
  retail-minus-paid spread, linking to its detail page.
- Engine: added bestValueScreening() to savings.ts (pure, integer cents;
  the period savings formula is untouched).
- Files: src/pages/Home.tsx, src/engine/savings.ts. No migration.

## 2026-06-22 − home-ledger
(this push)
- Home: ledger equation under the hero number, value − spent = saved. Display only; engine untouched.
- Hero pill reframed to Net positive / Not yet net positive (general
  theater ledger, not membership-bound).
- Gauge sub labeled "of value saved"; Total Spent rendered in cost-orange
  (sys-orange).
- Micro-label contrast lifted from bone-faint to bone-dim on Home + the
  charts Ring.
- Files: src/pages/Home.tsx, src/components/ui/charts.tsx. No migration.

## 2026-06-22 − repo-scaffold
2b59b57
- Established the committed docs/ knowledge base (protocols, specs, ops,
  archive, handoffs) and the ship-readmes/ archive.
- Moved loose .py / handoffs / mockups out of root; gitignored
  ship-scripts/.
- No application code or schema changes.

---

Entries begin at the docs/ reorganization. Surreel ran for months prior;
earlier history lives in git.

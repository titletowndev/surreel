# Surreel − Changelog

Curated ship log, newest first. The repo is canonical: read from a fresh
clone, prepend new entries under the header, never rewrite or reorder
existing ones.

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

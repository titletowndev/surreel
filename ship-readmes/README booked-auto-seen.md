# README — surreel booked-auto-seen

**2026-06-24 · Movies / engine · A booked screening leaves Booked the moment its showtime passes — derived from the clock, not a manual toggle.**

Booked/seen is now one derived predicate instead of a raw stored flag. Engine + display move together, so a passed booking counts toward savings automatically.

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | New `isScreeningSeen` / `isScreeningUpcoming` helpers in `period.ts`: upcoming = `is_upcoming` **AND** showtime in the future | A booked row sat in Booked forever; nothing compared showtime to now |
| 2 | Movies grouping + logged count use the derived predicate | Toy Story 5 stayed Booked at 11:24 PM after its 6:00 PM show |
| 3 | Savings engine (`seenInPeriod`), Rewind years, Screens, ticketValue suggestions all switch to the same predicate | Display and engine must agree, or a row looks logged but counts nothing |
| — | Stored `is_upcoming` flag and the form toggle are untouched | It stays the creation-time intent; the clock decides the rest |

Scope: no migration, no DB write, no job — purely reactive. Once a showtime passes, the `ticket_value` you already entered counts toward savings.

## Files in this bundle

```
patch_booked_auto_seen.py     → ~/Developer/surreel/ship-scripts/   (after run)
README booked-auto-seen.md    → ~/Developer/surreel/ship-readmes/   (after run)
```

Patch targets: `src/lib/period.ts`, `src/engine/savings.ts`, `src/lib/ticketValue.ts`, `src/pages/Movies.tsx`, `src/pages/Rewind.tsx`, `src/pages/Screens.tsx`, `CHANGELOG.md`.

## Drop-in

```bash
python3 << 'EOF'
from pathlib import Path
import glob, shutil, subprocess

HOME = Path.home()
REPO = HOME / "Developer" / "surreel"
READMES = REPO / "ship-readmes"
SCRIPTS = REPO / "ship-scripts"
for d in (READMES, SCRIPTS):
    d.mkdir(parents=True, exist_ok=True)

def find(name):
    for base in ("Downloads", "Desktop"):
        hits = glob.glob(str(HOME / base / "**" / name), recursive=True)
        if hits:
            return Path(hits[0])
    return None

patch = find("patch_booked_auto_seen.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")

readme = find("README booked-auto-seen.md")
if readme:
    shutil.move(str(readme), str(READMES / readme.name))
    print("archived " + readme.name + " -> ship-readmes/")
EOF
```

## Pre-flight checks

```bash
cd ~/Developer/surreel && \
npm run build && \
echo "build green" && \
grep -q "export function isScreeningSeen" src/lib/period.ts && \
grep -q "isScreeningUpcoming(s)).sort" src/pages/Movies.tsx && \
echo "change present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "Booked screenings auto-transition to seen when showtime passes" && git push
```

## Cleanup

The Drop-in already relocated the patch → `ship-scripts/` and README → `ship-readmes/`. Optional defensive sweep:

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_booked_auto_seen.py" -delete 2>/dev/null; echo "swept"
```

## UI verification

1. Wait ~1–2 min for Cloudflare, then hard-refresh `surreel.pages.dev/movies` (⌘⇧R).
2. **Toy Story 5** (6:00 PM today, now past) should no longer be under **Booked** — it drops into the `2026` group with a plain `Jun 24, 2026` date pill (no green/amber time pill).
3. **Booked** should now hold only genuinely future showtimes: Obsession (Jun 25), Supergirl (Jun 30), Spider-Man (Jul 30).
4. The **logged** count top-right should tick up by one (Toy Story 5 now counts as seen).
5. Open **Home** — net savings should reflect Toy Story 5's entered `ticket_value`. If you left its value blank, it contributes $0 (harmless); fill it in to capture the savings.
6. **Rewind** and **Screens** should include Toy Story 5 in 2026 stats.
7. Mobile: same checks at a narrow width.

## What this ship does NOT cover

- **No-shows.** If you book a showtime and skip it, after that time it still auto-flips to seen and counts its `ticket_value`. Edit the row (zero the value) or delete it. A "did you actually go?" confirm step is out of scope here.
- **No retroactive cleanup.** Existing rows you had already manually unchecked are unaffected; this only changes how the clock is read going forward.
- **Form toggle unchanged.** "Booked — not seen yet" still sets the stored intent at creation; it just no longer outlives the showtime.
- **`savings.ts` header comment** still documents the older single-paid formula (separate backlog item) — not touched here.

# README — surreel reel-reads

**2026-06-22 · Home · Turn the charts into reads — a plain-English takeaway on every Reel Story card + a Best Value screening card.**

Display work plus one pure engine helper. No migration. Builds on current `main` (`b7113ff`); the canonical CHANGELOG is already in place, so this ship carries its own changelog entry.

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | A one-line takeaway under each Reel Story card: How I Spend (biggest slice), What I Watch (top genre + count), Where I Watch (most-used theater + count), When I Watched (streak / most-frequent day) | The cards showed data but not a read. The critique's highest story-clarity payoff after the equation. |
| 2 | New **Best Value** card above The Reel Story: poster + title + `value · paid · saved`, linking to the screening detail | Ties the abstract ledger numbers to one memorable movie. |
| 3 | `bestValueScreening()` added to `src/engine/savings.ts` (pure, integer cents) | Per-screening max of `(ticket_value + additional_tickets_value) − (amount_paid + additional_tickets_cost)`. Membership monthly fee is a period-level offset, so it is **not** folded into a single row. The period savings formula is untouched. |

Engine addition is additive and isolated — `computeSavings` and the 2×2 are unchanged.

## Files in this bundle

```
patch_reel_reads.py   → run in place (CHANGELOG.md + src/engine/savings.ts + src/pages/Home.tsx)
README reel-reads.md  → ship-readmes/ (archived by the Drop-in)
```

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

patch = find("patch_reel_reads.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")
else:
    print("patch_reel_reads.py not found in Downloads/Desktop")

readme = find("README reel-reads.md")
if readme:
    shutil.move(str(readme), str(READMES / readme.name))
    print("archived " + readme.name + " -> ship-readmes/")
EOF
```

## Pre-flight checks (chained, zsh paste-safe)

```bash
cd ~/Developer/surreel && \
npm run build && \
echo "build green" && \
grep -q "Best value so far" src/pages/Home.tsx && \
grep -q "bestValueScreening" src/engine/savings.ts && \
grep -q "reel-reads" CHANGELOG.md && \
echo "change present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "reel-reads: per-card takeaways on Home + Best Value screening card" && git push
```

## Cleanup

The Drop-in already moved the patch → `ship-scripts/` and README → `ship-readmes/`. Optional sweep:

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_reel_reads.py" -delete 2>/dev/null; echo "swept"
```

## UI verification

1. Wait ~1–2 min for Cloudflare, then hard-refresh `https://surreel.pages.dev` in Safari (⌘⇧R).
2. **Best Value card** sits between the stat grid and The Reel Story: poster on the left, title, and a line reading `<value> value · <paid> paid · <saved> saved` (saved in green). Tapping it opens that screening's detail.
3. **The Reel Story** — each of the four cards now has a muted sentence under its chart:
   - How I Spend → `Mostly <slice>: $X of $Y.`
   - What I Watch → `<Genre> leads with <n>.`
   - Where I Watch → `Most at <theater> (<n>).`
   - When I Watched → `Current streak: <n> weeks.` (or `Mostly <Day>s.` when no active streak)
4. With your current 2 movies the reads should be sensible (e.g. the higher-saved of the two as Best Value; the lead genre with 2). No "undefined"/blank lines.
5. Check **iPhone Safari** — the takeaway line and the `·`-separated money line should wrap cleanly on a narrow screen.

## What this ship does NOT cover

- **Recent screenings strip** (last 2–3 watched) — still deferred; it is a new list component, separate from the single Best Value object.
- **Break-even / membership-pace module** — still scoped out (ill-defined across mixed acquisition).
- **Desktop left rail / top nav** — deferred.
- **The home-ledger changelog SHA** still reads `(this push)` on `main` — cosmetic; swap it for `afa1b87`/`b7113ff` whenever, or leave it.
- **Empty-state polish** for When I Watched (mini calendar of watched days) — the takeaway line softens the emptiness but the chart itself is unchanged.

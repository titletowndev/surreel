# README — surreel home-ledger

**2026-06-22 · Home · Make the ledger legible — show the math, name the percent, color the spend, lift the faint labels.**

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | Ledger equation under the hero number: `value − spent = saved` | The math was implied; users had to infer the formula. Now it is on the page. |
| 2 | Hero pill reframed: `Ahead of membership` → `Net positive` / `Not yet net positive` | "Ahead of membership" is AMC-era and vague. Surreel is a general theater ledger; `breakEven` is literally `gross_value ≥ total_spent`, so say that. |
| 3 | Gauge sub-label `Saved` → `of value saved` | "18%" had no referent. It is `net_savings ÷ gross_ticket_value` — percent of retail value. |
| 4 | `Total Spent` rendered in cost-orange (`text-sys-orange`) | Spend was visually neutral. Green = saved, orange = spend tightens the money story. |
| — | Micro-label contrast bump: `text-bone-faint` (0.30) → `text-bone-dim` (0.60) on the gauge sub + drill-down stat labels | Near-invisible at low brightness / on iPhone. a11y. |

Engine untouched — **display only. No migration.** Token note: `amber` in this palette is Apple system **blue** (interactive accent), so the real cost hue is `sys-orange` (#FF9F0A) — that is what #4 uses.

## Files in this bundle

```
patch_home_ledger.py   → run in place (edits src/pages/Home.tsx + src/components/ui/charts.tsx)
README home-ledger.md  → ship-readmes/ (archived by the Drop-in)
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

patch = find("patch_home_ledger.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")
else:
    print("patch_home_ledger.py not found in Downloads/Desktop")

readme = find("README home-ledger.md")
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
grep -q "text-sys-orange" src/pages/Home.tsx && \
grep -q "of value saved" src/pages/Home.tsx && \
echo "change present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "home-ledger: surface the ledger on Home (equation, net-positive pill, gauge label, spend color, label contrast)" && git push
```

## Cleanup

The Drop-in already moved the patch → `ship-scripts/` and README → `ship-readmes/`. Optional defensive sweep:

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_home_ledger.py" -delete 2>/dev/null; echo "swept"
```

## UI verification

1. Wait ~1–2 min for Cloudflare, then hard-refresh `https://surreel.pages.dev` in Safari (⌘⇧R).
2. **Hero:** under the big saved number a thin line reads `$30.38 value − $24.99 spent = $5.39 saved` (your real numbers).
3. **Pill:** reads `Net positive` (green) when value ≥ spent, `Not yet net positive` otherwise — no more "Ahead of membership".
4. **Gauge:** the small label under the `%` reads `OF VALUE SAVED`.
5. **Total Spent** tile renders in orange, visibly distinct from the green saved number.
6. **Contrast:** the gauge sub and the drill-down labels (top genre / theaters / streak) are clearly readable, not ghost-faint.
7. Check **iPhone Safari** too — the contrast bump matters most at low brightness.

## What this ship does NOT cover

- **`CHANGELOG.md` was NOT touched.** The repo's `CHANGELOG.md` is the `extend` npm package's changelog (committed by mistake in the scaffold commit `2b59b57`) — zero Surreel history. Per the canonical "never silently overwrite" rule I left it alone. It needs a one-time **regeneration ship** before the in-commit changelog protocol can resume. Say the word and I will deliver that as its own tiny patch.
- **The Reel Story per-card plain-English takeaways** (How I Spend / What I Watch / Where / When → one-sentence reads) — batch 2.
- **Best Value screening card** (ties the ledger to an actual movie) — batch 2, needs a per-screening savings max.
- **Recent screenings strip** — deferred (new component).
- **Break-even / membership-pace module** — scoped out: clean only for `membership_programs`, ill-defined across mixed acquisition.
- **Desktop left rail / top nav** — deferred.

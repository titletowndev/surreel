# README — surreel fees-tile

**2026-06-22 · Home + Nav · Give waived fees its own labeled line (separate from net savings) and lift the inactive nav-label contrast.**

Display only. No migration. **Stacks on `recent`** — push that first.

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | Waived fees moved out of the hero pill into a dedicated **Fees Waived** line below the stat grid (neutral color, only shown when > 0) | Your rules treat `fees_saved` as a separate bonus stat, never folded into savings. A labeled line keeps it visible and unambiguous, away from the net-savings number. |
| 2 | Inactive bottom-nav labels bumped `text-bone-faint` (0.30) → `text-bone-dim` (0.60), hover → full | The remaining low-contrast spot the critique flagged; near-invisible at low brightness. |

Engine untouched. The hero keeps the Net-positive pill; the fees pill is replaced by a sentinel comment.

## Files in this bundle

```
patch_fees_tile.py   → run in place (CHANGELOG.md + src/pages/Home.tsx + src/App.tsx)
README fees-tile.md  → ship-readmes/ (archived by the Drop-in)
```

## Order — push `recent` first

This ship's changelog entry anchors on `recent`. If `recent` is not on `main` yet, the patch **stops cleanly at `CHANGELOG.md` with code untouched**. Ship `recent` (you already have it), then apply this. Verified behavior — it will not partially apply.

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

patch = find("patch_fees_tile.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")
else:
    print("patch_fees_tile.py not found in Downloads/Desktop")

readme = find("README fees-tile.md")
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
grep -q "Fees Waived" src/pages/Home.tsx && \
grep -q "text-bone-dim hover:text-bone" src/App.tsx && \
grep -q "fees-tile" CHANGELOG.md && \
echo "change present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "fees-tile: dedicated Fees Waived line + nav label contrast" && git push
```

## Cleanup

Self-maintaining sweep — removes ship artifacts from Downloads/Desktop only if already archived, plus empty `files/` wrappers; personal files untouched:

```bash
python3 << PY
from pathlib import Path
import glob, os

HOME = Path.home()
REPO = HOME / "Developer" / "surreel"
SCRIPTS = REPO / "ship-scripts"
READMES = REPO / "ship-readmes"
removed = []

for root in [HOME / "Downloads", HOME / "Desktop"]:
    if not root.is_dir():
        continue
    for p in glob.glob(str(root / "**" / "patch_*.py"), recursive=True):
        if (SCRIPTS / os.path.basename(p)).is_file():
            os.remove(p); removed.append(p)
    for p in glob.glob(str(root / "**" / "README *.md"), recursive=True):
        if (READMES / os.path.basename(p)).is_file():
            os.remove(p); removed.append(p)
    for d in sorted(glob.glob(str(root / "**" / "files"), recursive=True), key=len, reverse=True):
        if os.path.isdir(d) and not os.listdir(d):
            os.rmdir(d); removed.append(d + "/")

for p in removed:
    print("removed " + p)
print(str(len(removed)) + " swept; personal files untouched")
PY
```

## UI verification

1. Wait ~1–2 min for Cloudflare, then hard-refresh `https://surreel.pages.dev` in Safari (⌘⇧R).
2. **Hero** now shows only the `Net positive` pill — the `+$… waived fees` pill is gone from the hero.
3. A slim **Fees Waived** line sits just below the six stat tiles: label on the left, `+$5.48` on the right in neutral (not green — it is a bonus, not part of savings). It hides entirely when fees are $0.
4. **Bottom nav**: the three inactive labels (Movies / Screens / Rewind when on Home) are clearly more legible than before; the active one is brightest.
5. Check **iPhone Safari** — the Fees Waived line stays single-row; nav labels readable at low brightness.

## What this ship does NOT cover

- **The reported "duplicate The Reel Story"** — not a code bug. Source and the built bundle contain the heading exactly once and Home renders once; covered in chat. If it persists after a hard refresh, send a screenshot.
- **Break-even pace line** — still held: ill-defined across mixed acquisition; the Net-positive pill already carries that read.
- **When I Watched mini-calendar** — skipped: the analytics page already has a day×time heatmap + per-month line; a calendar would duplicate them.

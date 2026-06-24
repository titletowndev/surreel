# README — surreel credits-pill

**2026-06-24 · Movies list · teal credits pill so stingers show at a glance.**

Display only — one file, no migration. Builds on the `credits-scenes` columns. Clicking a row still opens the detail view (which already carries the full Credits scene row).

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | Movies list rows show a **teal credits pill** when a screening is marked with a during- and/or after-credits scene | Stinger status was only visible after opening each film — now scannable in the list |
| 2 | Pill text reflects which: `During-credits`, `After-credits`, or `During + after credits` | Matches the data you marked |
| — | Pill appears **only for confirmed scenes (Yes)** — Unmarked and None stay clean | Keeps rows uncluttered; absence of a pill = nothing to catch (or not yet checked) |

## Files in this bundle

```
patch_credits_pill.py      → runs in place against ~/Developer/surreel
README credits-pill.md     → ship-readmes/ (archived by the Drop-in)
```

Patch edits 1 file in place and prepends the `CHANGELOG.md` entry: `src/pages/Movies.tsx`, `CHANGELOG.md`.

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

patch = find("patch_credits_pill.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")

readme = find("README credits-pill.md")
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
grep -q "function stingerLabel" src/pages/Movies.tsx && \
grep -q "border-sys-teal" src/pages/Movies.tsx && \
echo "change present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "credits-pill: surface during/after-credits scenes on the Movies list" && git push
```

## Cleanup

The Drop-in already relocated the patch → `ship-scripts/` and README → `ship-readmes/`. Optional defensive sweep:

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_credits_pill.py" -delete 2>/dev/null; echo "swept"
```

## UI verification

1. Wait ~1–2 min for Cloudflare, then hard-refresh (⌘⇧R) and open **Movies**.
2. The **I Love Boosters** row (you marked After-credits = Yes) should now show a teal **After-credits** pill alongside its date/format pills.
3. A film with both flags marked Yes reads **During + after credits**; one marked No or left Unmarked shows **no** credits pill.
4. Tap the row → detail still opens with the full **Credits scene** row.
5. Check iPhone: the extra pill wraps to a second line on narrow widths rather than truncating — confirm it reads cleanly.

## What this ship does NOT cover

- No filter/sort by stinger on the Movies list (e.g. "show only films with a post-credits scene") — pill is a display marker only.
- No analytics tile (count or % of films with a stinger).
- "No" marks are not shown in the list — only confirmed Yes scenes get a pill; the No/Unmarked distinction lives on the detail view.

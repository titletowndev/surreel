# README — surreel credits-detail-rows

**2026-06-24 · ScreeningDetail · always show During-credits / After-credits status, even on unmarked films.**

Display only — one file, no migration. Builds on the `credits-scenes` columns.

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | ScreeningDetail shows **two always-on rows** — `During-credits` and `After-credits` — each reading **Yes / No / Not marked** | The old single combined row was hidden until a film was marked, so unmarked films (e.g. Toy Story 5) told you nothing here |
| 2 | **Not marked** renders faint; **Yes / No** render normal | Keeps unmarked state visible but quiet, and doubles as a prompt to mark it (via Edit) |

Replaces the prior `{creditsLine && <Row label="Credits scene" .../>}` conditional row.

## Files in this bundle

```
patch_credits_detail_rows.py      → runs in place against ~/Developer/surreel
README credits-detail-rows.md     → ship-readmes/ (archived by the Drop-in)
```

Patch edits 1 file in place and prepends the `CHANGELOG.md` entry: `src/pages/ScreeningDetail.tsx`, `CHANGELOG.md`.

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

patch = find("patch_credits_detail_rows.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")

readme = find("README credits-detail-rows.md")
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
grep -q "label=\"During-credits\"" src/pages/ScreeningDetail.tsx && \
grep -q "label=\"After-credits\"" src/pages/ScreeningDetail.tsx && \
echo "change present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "credits-detail-rows: always show During/After-credits status on the detail view" && git push
```

## Cleanup

The Drop-in already relocated the patch → `ship-scripts/` and README → `ship-readmes/`. Optional defensive sweep:

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_credits_detail_rows.py" -delete 2>/dev/null; echo "swept"
```

## UI verification

1. Wait ~1–2 min for Cloudflare, then hard-refresh (⌘⇧R) and open the **Toy Story 5** screening.
2. Below **Format** you should now see two rows: **During-credits** and **After-credits**, both reading a faint **Not marked**.
3. Hit **Edit**, set one to Yes and the other to No, save → the rows update to bright **Yes** / **No**.
4. Open **I Love Boosters** (After = Yes) → **During-credits** reads No or Not marked, **After-credits** reads **Yes**.
5. Check iPhone: the two rows sit in the same card stack as the other detail rows, right-aligned values.

## What this ship does NOT cover

- The detail page reports the status you've recorded — it does not auto-fetch the answer from the web. TMDB pre-fill still happens only on Add/Edit (and only asserts Yes); for Toy Story 5 you'd mark it via Edit.
- Movies-list pill (credits-pill ship) is unchanged — it still appears only for confirmed Yes scenes.
- No "Not marked" affordance on the list; the unmarked state surfaces only on the detail view.

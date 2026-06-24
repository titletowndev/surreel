# README — surreel inapp-brand

**2026-06-23 · app UI · replace the placeholder header logo with the real brand: gold reel mark + GT Sectra "Surreel" wordmark. Same wordmark on the loading splash.**

App code ship (`src/App.tsx` + one new component). The wordmark renders as **outlined SVG** (verbatim glyphs, `fill="currentColor"`) — no font file in the repo, inherits the surrounding text colour. `tsc -b` is the gate; bundle hash moves because real code changed.

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | Header `⊙ Surreel` placeholder → `<ReelMark/>` + `<Wordmark/>` | the header was a CSS circle-dot + system-font text; no actual brand was in the app |
| 2 | Loading splash text → `<Wordmark/>` (colour/flicker preserved) | splash was plain "Surreel" in system font |
| 3 | New `src/components/ui/brand.tsx` — `ReelMark` + `Wordmark` | reusable, verbatim v7 marks |
| — | Wordmark is outlined vector, `currentColor` | no `.ttf` shipped; mark inherits `text-bone` (header) / `text-amber` (splash) |

Marks are verbatim: reel `e0f28d2d`, wordmark `20dd3299` — same geometry as the lockup and the favicon set.

## Files in this bundle

```
patch_inapp-brand.py    -> runs (writes src/components/ui/brand.tsx, edits src/App.tsx + CHANGELOG.md), then ship-scripts/
README inapp-brand.md   -> ship-readmes/
```

No separate asset files — the patch writes the new component itself (paste-unsafe quotes live safely inside the downloaded script).

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

patch = find("patch_inapp-brand.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name)

readme = find("README inapp-brand.md")
if readme:
    shutil.move(str(readme), str(READMES / readme.name))
    print("archived " + readme.name)
EOF
```

## Pre-flight checks

```bash
cd ~/Developer/surreel && \
npm run build && \
echo "build green" && \
grep -q "ReelMark" src/App.tsx && echo "header wired" && \
ls src/components/ui/brand.tsx >/dev/null && echo "brand component present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "inapp-brand: reel mark + GT Sectra wordmark in header and splash" && git push
```

## Cleanup

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_inapp-brand.py" -delete 2>/dev/null; echo "swept"
```

## UI verification

1. Wait ~1–2 min for Cloudflare, hard-refresh `https://surreel.pages.dev` (⌘⇧R).
2. **Header (top-left):** gold film-reel mark + "Surreel" set in GT Sectra — not the old outlined circle-dot and not the system font.
3. **Loading splash:** on a cold load / refresh you briefly see the GT Sectra wordmark (same colour as before).
4. Reel mark and wordmark sit baseline-centred, ~26px / ~20px tall; no clipping, crisp on retina.
5. Mobile: same, header not crowded at 390px width.

## What this ship does NOT cover

- **Bottom-nav tab glyphs** (`◉ ▦ ▢ ↺`) — still the placeholder unicode marks; untouched.
- **Splash colour** — left as `text-amber` (unchanged); only the glyphs swapped to GT Sectra. Note `amber` resolves to the system-blue token, so the splash colour is whatever it was — say the word if you want it re-coloured.
- **Login page** (`src/pages/Login.tsx`) — not inspected here; if it has its own placeholder mark, that's a follow-up.
- **Favicon / PWA** — shipped separately in `monogram-icons`.
- **OG share image**, **`reel.svg` orphan**, **GT Sectra license** — still open from earlier.

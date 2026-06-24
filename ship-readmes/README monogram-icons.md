# README — surreel monogram-icons

**2026-06-23 · favicon / app-icon / PWA · swap the placeholder reel.svg favicon for the full Surreel S-monogram icon set and wire the web manifest.**

Static assets + `index.html` only — no TypeScript, no engine, no migration. Build stays green by construction; `tsc -b` has nothing to chew on, but it runs anyway as the gate.

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | S-monogram favicon (`favicon.svg` + `.ico` + 16/32 PNG) replaces `/reel.svg` | reel-only favicon read as a generic film reel, not Surreel; the **S** is legible to 16px |
| 2 | `apple-touch-icon.png` (180, opaque square, full monogram) | iOS home-screen / Safari; opaque per Apple (no transparent corners) |
| 3 | PWA icons `icon-192/512.png` (any) + `icon-192/512-maskable.png` (full-bleed) + `site.webmanifest` | installable PWA; maskable scaled to 0.936 so the mark sits inside Android's safe circle |
| 4 | `index.html` icon links repointed; `theme-color` → `#02060F` | wire the new set; chrome colour matches the icon background |
| — | Every mark is verbatim v7 geometry — S-glyph `12beff878b72`, reel `e0f28d2dd925` | one icon across the whole brand set, hash-matched |

Favicon uses the **S-only** reduction (tab legibility); app / PWA / apple-touch use the **full monogram** (S + reel jewel + teal +).

## Files in this bundle

```
favicon.svg              -> public/favicon.svg
favicon.ico              -> public/favicon.ico
favicon-16.png           -> public/favicon-16.png
favicon-32.png           -> public/favicon-32.png
apple-touch-icon.png     -> public/apple-touch-icon.png
icon-192.png             -> public/icon-192.png
icon-512.png             -> public/icon-512.png
icon-192-maskable.png    -> public/icon-192-maskable.png
icon-512-maskable.png    -> public/icon-512-maskable.png
site.webmanifest         -> public/site.webmanifest
patch_monogram-icons.py  -> runs, then ship-scripts/
README monogram-icons.md -> ship-readmes/
```

## Drop-in

```bash
python3 << 'EOF'
from pathlib import Path
import glob, shutil, subprocess

HOME = Path.home()
REPO = HOME / "Developer" / "surreel"
PUBLIC = REPO / "public"
READMES = REPO / "ship-readmes"
SCRIPTS = REPO / "ship-scripts"
for d in (PUBLIC, READMES, SCRIPTS):
    d.mkdir(parents=True, exist_ok=True)

def find(name):
    for base in ("Downloads", "Desktop"):
        hits = glob.glob(str(HOME / base / "**" / name), recursive=True)
        if hits:
            return Path(hits[0])
    return None

ASSETS = [
    "favicon.svg", "favicon.ico", "favicon-16.png", "favicon-32.png",
    "apple-touch-icon.png", "icon-192.png", "icon-512.png",
    "icon-192-maskable.png", "icon-512-maskable.png", "site.webmanifest",
]
for name in ASSETS:
    src = find(name)
    if src:
        shutil.copy(str(src), str(PUBLIC / name))
        print("placed public/" + name)
    else:
        print("MISSING " + name)

patch = find("patch_monogram-icons.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")

readme = find("README monogram-icons.md")
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
grep -q "/favicon.svg" index.html && echo "icon links present" && \
ls public/icon-512-maskable.png public/site.webmanifest >/dev/null && echo "assets present"
```

A favicon-only change does not move the JS bundle hash (no JS touched). The real tell: `dist/` contains `favicon.svg`, `apple-touch-icon.png`, the four PWA PNGs, and `site.webmanifest`, and `dist/index.html` carries the new `<link>` tags.

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "monogram-icons: S-monogram favicon + app-icon + PWA manifest" && git push
```

## Cleanup

The Drop-in already moved the patch to `ship-scripts/` and the README to `ship-readmes/`. Optional defensive sweep:

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_monogram-icons.py" -delete 2>/dev/null; echo "swept"
```

## UI verification

1. Wait ~1–2 min for Cloudflare to build, then hard-refresh `https://surreel.pages.dev` in Safari (⌘⇧R) or open a fresh tab.
2. **Tab favicon:** the tab shows the cream **S** on dark, not the old reel.
3. **View source / Network:** `/favicon.svg`, `/favicon.ico`, `/apple-touch-icon.png`, `/site.webmanifest` all 200 (not 404).
4. **iOS:** Share → Add to Home Screen — the home-screen icon is the full monogram on an opaque tile, corners clean (no black wedge).
5. **PWA install (desktop Chrome/Edge):** install prompt shows the monogram; installed icon is crisp.
6. **Android (if available):** installed icon is circle/squircle-masked with the mark centred, nothing clipped.
7. Confirm the browser chrome / address bar tint reads as the dark `#02060F`.

## What this ship does NOT cover

- **OG / social share image (1200×630)** — still missing; sharing the URL has no preview card. Next obvious ship.
- **Ticket icon set** — not used; the monogram won the app-mark call. The ticket masters stay in design review, not the repo.
- **16px S optical weight** — the S-only is legible but slightly thin at 16px; a one-size weight bump is available on request, not applied here.
- **Social avatars** — those are profile-upload assets, not repo files; unchanged.
- **`reel.svg`** — left in `public/` (now unreferenced, harmless); delete later if you want.
- **GT Sectra license** — the live-launch gate; outside this ship.

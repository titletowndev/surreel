# README — surreel prime-format

**2026-06-24 · data-model + ticketValue · Add "Prime at AMC" as a selectable screen format with a Dolby-tier retail upcharge.**

Additive only — new union member, no migration (screen_format is app-enforced free text).

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | `"Prime at AMC"` added to the `ScreenFormat` union and `SCREEN_FORMATS` array | Make it pickable in the Add/Edit format select; flows into formatMix / Rewind with no extra wiring |
| 2 | `formatUpcharge` gives Prime at AMC a **+5** retail upcharge (same tier as Dolby) | Prime is AMC top-tier laser PLF; suggested ticket value should reflect the premium |
| 3 | Prime at AMC excluded from the standalone PLF-toggle `+4` double-count | It is already a large format, like PLF/IMAX/Dolby — toggling PLF on must not stack |
| — | No migration | `screen_format` is stored free-text; the union is the only gate (TS + form select), per the data-model rules |

## Files in this bundle

```
patch_prime-format.py    → runs in place against ~/Developer/surreel
README prime-format.md   → ship-readmes/
```

Patch edits: `src/lib/types.ts`, `src/lib/ticketValue.ts`, `CHANGELOG.md`.

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

patch = find("patch_prime-format.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")

readme = find("README prime-format.md")
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
grep -q "Prime at AMC" src/lib/types.ts && \
grep -q "fmt === \"Prime at AMC\") up += 5" src/lib/ticketValue.ts && \
echo "change present" && \
ls -1 dist/assets/index-*.js
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "prime-format: add Prime at AMC screen format (+5 upcharge)" && git push
```

## Cleanup

The Drop-in already moved the patch to `ship-scripts/` and the README to `ship-readmes/`. Optional defensive sweep:

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_prime-format.py" -delete 2>/dev/null; echo "swept"
```

## UI verification

1. Wait ~1–2 min for Cloudflare, then hard-refresh `https://surreel.pages.dev` (⌘⇧R) or open a fresh Safari tab.
2. Go to **Add Screening** (or edit an existing one).
3. Open the **Format** dropdown — `Prime at AMC` now sits between `ScreenX` and `Other`.
4. Pick a real AMC theater, set format to `Prime at AMC`, leave the PLF toggle **off** — the suggested ticket value should rise by **+5** over a Standard pick at the same theater (matching Dolby).
5. Toggle PLF **on** with Prime at AMC selected — the suggested value must **not** jump another +4 (no double-count).
6. Save, then check **Analytics → What I Watch**: the new screening shows up in the Format mix bar list labeled `Prime at AMC`.
7. Mobile: same checks on iPhone Safari.

## What this ship does NOT cover

- No DB migration and no backfill — existing rows keep their current `screen_format`; re-tag any past Prime visits by hand.
- Upcharge is a tunable estimate (+5), not a per-theater real price — same caveat as every other format in `formatUpcharge`.
- No separate brand color/icon for Prime in charts; it renders through the standard `BarList` like other formats.
- Does not touch the booked-screenings / dashboard-projection decision still open from earlier.

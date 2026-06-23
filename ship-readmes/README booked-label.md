# README — surreel booked-label

**2026-06-23 · Movies + Add/Edit · Reframe upcoming screenings as Booked — confirmed tickets, not a wishlist.**

Copy only. No migration. No schema change (the `is_upcoming` flag stays). Applies on current `main`.

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | Movies page: the upcoming section header `Upcoming` → **`Booked`** | These rows are real bookings — locked date, time, theater, format — not things you might want to see. The header read like a wishlist. |
| 2 | Add/Edit screening: the not-seen-yet toggle `Planned (upcoming) — not seen yet` → **`Booked — not seen yet`** | "Planned" implied an intention/wishlist; the flag actually marks a booked future screening. |

The `is_upcoming` field and all logic are unchanged — this is wording only.

## Files in this bundle

```
patch_booked_label.py   → run in place (CHANGELOG.md + src/pages/Movies.tsx + src/pages/AddEditScreening.tsx)
README booked-label.md  → ship-readmes/ (archived by the Drop-in)
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

patch = find("patch_booked_label.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")
else:
    print("patch_booked_label.py not found in Downloads/Desktop")

readme = find("README booked-label.md")
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
grep -q ">Booked</h2>" src/pages/Movies.tsx && \
grep -q 'label="Booked' src/pages/AddEditScreening.tsx && \
grep -q "booked-label" CHANGELOG.md && \
echo "change present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "booked-label: reframe upcoming screenings as Booked, not a wishlist" && git push
```

## Cleanup

Self-maintaining sweep — removes archived ship artifacts + empty `files/` wrappers; personal files untouched:

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

1. Wait ~1–2 min for Cloudflare, hard-refresh `https://surreel.pages.dev/movies` (⌘⇧R).
2. The section above your past screenings now reads **Booked** (was "Upcoming"); the rows are unchanged (date/time, theater, format).
3. Open Add (＋) or edit a screening — the toggle now reads **Booked — not seen yet** (was "Planned (upcoming) — not seen yet").

## What this ship does NOT cover

- **The `is_upcoming` field name** — left as-is; renaming it is a schema + code churn with no user benefit. This ship only changes what you read on screen.
- **Internal code comments** in `demo.ts` / `savings.ts` that still say "upcoming/planned" — not user-facing; left untouched to keep the patch minimal.
- **Any "wishlist" feature** — if you ever do want a true want-to-see list (distinct from booked tickets), that's a separate, additive feature, not part of this relabel.

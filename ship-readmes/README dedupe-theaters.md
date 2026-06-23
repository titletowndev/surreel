# README — surreel dedupe-theaters

**2026-06-22 · Data layer · Stop the theater list from growing a duplicate row on every autocomplete pick.**

App-side, non-destructive. No migration. Applies directly on current `main` (`fees-tile`).

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | `addTheater` reuses an existing theater when a **normalized name + city + state** match, returning it instead of inserting a new row | The known landmine: Places autocomplete inserted a fresh `theaters` row per pick, so duplicates accumulated. Now a repeat pick links to the row you already have. |

Match is case/space-insensitive (`trim().toLowerCase()` on each field), applied in both demo and live paths. Engine, schema, and savings math untouched.

## Files in this bundle

```
patch_dedupe_theaters.py   → run in place (CHANGELOG.md + src/state/data.tsx)
README dedupe-theaters.md  → ship-readmes/ (archived by the Drop-in)
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

patch = find("patch_dedupe_theaters.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")
else:
    print("patch_dedupe_theaters.py not found in Downloads/Desktop")

readme = find("README dedupe-theaters.md")
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
grep -q "if (dup) return dup" src/state/data.tsx && \
grep -q "dedupe-theaters" CHANGELOG.md && \
echo "change present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "dedupe-theaters: reuse existing theater on add instead of inserting duplicates" && git push
```

## Cleanup

Self-maintaining sweep — removes archived ship artifacts + empty `files/` wrappers from Downloads/Desktop; personal files untouched:

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

## Verification (behavioral — no new UI)

1. Wait ~1–2 min for Cloudflare, hard-refresh (⌘⇧R).
2. Add a screening and pick — via autocomplete — a theater you already have logged (same name/city). Save.
3. In the Supabase Table Editor (`theaters`), confirm **no new duplicate row** was created; the screening's `theater_id` points at the existing row.
4. Repeat with a genuinely new theater — it still inserts once, as before.
5. Quick console/Network check optional: the add no longer fires a `theaters` insert when a match exists.

## What this ship does NOT cover

- **Existing duplicates** already in the table — this prevents *new* ones only. To merge old dupes: in the Table Editor, repoint each screening's `theater_id` to the keeper, then delete the extra rows (`ON DELETE SET NULL` makes that safe). Say the word if you want a guided merge runbook.
- **A DB-level unique constraint** — intentionally not added; a unique index would fail against the current duplicate rows and risks paste-unsafe SQL. App-side reuse is the non-destructive fix.
- **Fuzzy matching** — exact normalized name+city+state only; it won't merge two genuinely distinct theaters that share all three (vanishingly rare), and won't catch dupes that differ by punctuation/abbreviation in the stored name.

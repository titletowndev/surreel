# README — surreel screen-format-check (fix)

**2026-06-24 · migration · Drop the legacy single-quoted `screen_format` CHECK enum so "Prime at AMC" (and any future format) saves.**

Root cause of "editing the movie doesn't save." DB-only — no code change; the app already sends the value.

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | Migration `0005_drop_screen_format_check` drops constraint `screenings_screen_format_check` | The live `screenings` table still carried the 0001 inline CHECK `screen_format in (Standard…Other)`, which never included `Prime at AMC` |
| — | No code change | `prime-format` already added the value to the `ScreenFormat` union + form select; the only blocker was the DB constraint |
| — | `screen_format` is now app-side-enforced only | Matches the project rule "no single-quoted CHECK enums"; future formats need no migration |

**Why it looked like a silent failure:** `updateScreening` / `addScreening` set the data-context `error` but do **not** throw, and that error is only rendered on the initial loader — so a rejected save just navigated to `/movies` as if it worked. Surfacing that error is a separate hardening (see "Does NOT cover").

## Files in this bundle

```
patch_screen-format-check.py     → runs in place (prepends CHANGELOG entry)
README screen-format-check.md    → ship-readmes/
```

The migration `.sql` is written by the heredoc below (Step 1), committed via `git add -A`.

## Step 1 — Migration (run FIRST, before the Drop-in)

Writes the migration file, then pushes it. Paste your session-pooler password inline where shown.

```
cd ~/Developer/surreel
cat > supabase/migrations/0005_drop_screen_format_check.sql << SQL
-- drop the legacy single-quoted screen_format CHECK enum; allowed values are enforced app-side via the ScreenFormat union
alter table public.screenings
  drop constraint if exists screenings_screen_format_check;
SQL
supabase db push --db-url "postgresql://postgres.vlqjpeskwkbyaypffaai:<DB_PASSWORD>@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

Confirm the push prompt with `y`. This alone fixes saving immediately — no redeploy needed.

## Step 2 — Drop-in (prepend CHANGELOG, archive bundle)

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

parents = set()

patch = find("patch_screen-format-check.py")
if patch:
    parents.add(patch.parent)
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")

readme = find("README screen-format-check.md")
if readme:
    parents.add(readme.parent)
    shutil.move(str(readme), str(READMES / readme.name))
    print("archived " + readme.name + " -> ship-readmes/")

for p in parents:
    if p not in (HOME / "Downloads", HOME / "Desktop"):
        try:
            p.rmdir(); print("pruned empty wrapper " + p.name)
        except OSError:
            pass
EOF
```

## Pre-flight checks

```bash
cd ~/Developer/surreel && \
npm run build && \
echo "build green" && \
test -f supabase/migrations/0005_drop_screen_format_check.sql && echo "migration present" && \
grep -q "screen-format-check" CHANGELOG.md && echo "changelog present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "screen-format-check: drop legacy screen_format CHECK enum (fixes Prime at AMC save)" && git push
```

## Cleanup

The Drop-in already archived the patch and README and pruned the empty download wrapper. Optional defensive sweep:

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_screen-format-check.py" -delete 2>/dev/null; echo "swept"
```

## UI verification

1. No deploy wait needed for the save fix — the migration is live the moment `db push` succeeds. (The commit/push only ships the migration file + changelog.)
2. In Surreel, edit a screening, set **Format → Prime at AMC**, Save.
3. It now returns to the list and the screening shows `Prime at AMC` (re-open it to confirm the format stuck).
4. Edit again, switch back to **Standard**, Save — confirms normal formats still save.
5. Add a brand-new screening with **Prime at AMC** — saves clean.
6. Mobile: same check on iPhone Safari.

## What this ship does NOT cover

- **Silent save failures.** `addScreening` / `updateScreening` swallow Supabase errors (set context error, no throw) and the form navigates away regardless; that error is only shown on the initial loader. Recommend a follow-up patch making both throw so `handleSave` surfaces the message in the form. Say the word and I will ship it.
- **The other legacy single-quoted CHECK enums** — `theaters.chain` and `membership_charges.source` carry the same 0001 trap. Not touched here; flag for a future cleanup migration if you ever extend those value sets.
- No backfill or data change — existing rows are untouched; the constraint is simply removed.

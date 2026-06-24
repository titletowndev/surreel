# README — surreel credits-scenes

**2026-06-24 · screenings + Add/Edit + Detail · per-screening during/after-credits tracking with TMDB pre-fill.**

Engines untouched — display + capture only. New columns are nullable so "not checked" stays distinct from "no scene."

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | `during_credits` / `after_credits` — two **nullable** booleans on `screenings` (migration `0006` + `types.ts`) | Want to log mid/post-credits scenes per film without losing the "haven't checked yet" state |
| 2 | Add/Edit **Credits scenes** block — tri-state controls (Unmarked / Yes / No) under the 3D·PLF row | Manual capture; `null`/`true`/`false` all reachable |
| 3 | TMDB pre-fill on movie pick + Refresh — `duringcreditsstinger` / `aftercreditsstinger` keywords set the toggles to **Yes** | Saves a tap when TMDB already tags it |
| 4 | ScreeningDetail **Credits scene** row, shown only when a flag is marked | Surfaces the data on the read view |
| — | Pre-fill is **upgrade-only**: a missing keyword never forces **No**, and TMDB can flip `null → Yes` but never overrides a manual mark | TMDB keywords are community-contributed — they assert presence, never absence |

## Files in this bundle

```
patch_credits_scenes.py      → runs in place against ~/Developer/surreel
README credits-scenes.md     → ship-readmes/ (archived by the Drop-in)
```

The patch edits 6 files in place and prepends the `CHANGELOG.md` entry:
`src/lib/types.ts`, `src/lib/tmdb.ts`, `src/lib/demo.ts`, `src/pages/AddEditScreening.tsx`, `src/pages/ScreeningDetail.tsx`, `CHANGELOG.md`.

## Migration first (DB before code)

Run this **before** the Drop-in. Paste-safe heredoc (no `$`, no backticks, no apostrophes), then push. Swap `<DB_PASSWORD>` for the session-pooler password and confirm `[Y/n]` with `y`:

```
cd ~/Developer/surreel
cat > supabase/migrations/0006_add_credits_scenes.sql << SQL
-- per-screening during/after-credits scene flags; nullable: null unmarked, true scene, false none. enforced app-side, no CHECK.
alter table public.screenings
  add column if not exists during_credits boolean,
  add column if not exists after_credits boolean;
SQL
supabase db push --db-url "postgresql://postgres.vlqjpeskwkbyaypffaai:<DB_PASSWORD>@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
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

patch = find("patch_credits_scenes.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")

readme = find("README credits-scenes.md")
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
grep -q "function deriveStingers" src/lib/tmdb.ts && \
grep -q "Credits scenes" src/pages/AddEditScreening.tsx && \
grep -q "during_credits boolean" supabase/migrations/0006_add_credits_scenes.sql && \
echo "all present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "credits-scenes: per-screening during/after-credits tracking + TMDB pre-fill (migration 0006)" && git push
```

## Cleanup

The Drop-in already moved the patch → `ship-scripts/` and README → `ship-readmes/`. Optional defensive sweep:

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_credits_scenes.py" -delete 2>/dev/null; echo "swept"
```

## UI verification

1. Wait ~1–2 min for Cloudflare, then hard-refresh (⌘⇧R) at `https://surreel.pages.dev`.
2. **Add screening** → pick a film with a known post-credits scene (e.g. a Marvel title). After enrich, the **After-credits scene** control should land on **Yes** automatically; a film with no TMDB stinger keyword stays **Unmarked** (not No).
3. Toggle either control through **Unmarked / Yes / No** — active segment is filled blue.
4. Save, open the screening — a **Credits scene** row appears (e.g. `During-credits no · After-credits yes`). Leave both Unmarked → the row is absent.
5. Edit an existing screening: prior marks hydrate; hitting **Refresh** on the movie card can upgrade an Unmarked flag to Yes but never clears a mark you set.
6. Check both desktop Safari and iPhone — the tri-state row should wrap cleanly at narrow widths.

## What this ship does NOT cover

- No analytics surface yet (no "% of films with a stinger", no filter on the Movies list) — capture only.
- TMDB keyword slugs are matched tolerantly (`during`/`mid` + `credit`, `after`/`post` + `credit`); confirmed against canonical TMDB keywords but not re-validated against the live API from the sandbox (TMDB isn't reachable there). If a real pick mis-detects, grab the film's `/keywords` payload and I'll tighten the matcher.
- No backfill of existing rows — every current screening reads `null` (Unmarked) until you mark or re-enrich it.
- Detail row is plain text, consistent with sibling rows — no teal/coral glyph treatment.

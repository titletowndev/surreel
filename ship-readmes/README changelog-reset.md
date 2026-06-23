# README — surreel changelog-reset

**2026-06-22 · repo · Replace the mis-committed `extend` npm changelog with a canonical Surreel one — unblocks the in-commit changelog protocol.**

The repo's `CHANGELOG.md` is the `extend` package's changelog, committed by mistake in scaffold commit `2b59b57` (zero Surreel history). This regenerates it. No code, no build, no schema change.

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | `CHANGELOG.md` rewritten to a fresh Surreel changelog: header + `home-ledger` + `repo-scaffold` entries | The committed file was a foreign npm changelog; every future ship's in-commit entry had nowhere valid to prepend. |
| — | Guarded + idempotent: skips if already Surreel, **aborts** if the file is neither the known-foreign one nor Surreel | Honors disk-is-canonical — never clobber real history if the file changed under us. |

This is a wholesale regeneration, not a surgical patch (there is no real prior content to preserve). From here the normal protocol resumes: future patches carry a `CHANGELOG.md` EDITS entry that **prepends** under the `# Surreel — Changelog` header.

## Files in this bundle

```
patch_changelog_reset.py   → run in place (rewrites CHANGELOG.md)
README changelog-reset.md  → ship-readmes/ (archived by the Drop-in)
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

patch = find("patch_changelog_reset.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")
else:
    print("patch_changelog_reset.py not found in Downloads/Desktop")

readme = find("README changelog-reset.md")
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
grep -q "# Surreel" CHANGELOG.md && \
grep -q "home-ledger" CHANGELOG.md && \
echo "changelog canonical"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

If `home-ledger` is **not pushed yet**, fold both into one commit (its code + this changelog ride together — exactly the protocol):

```bash
git add -A && git commit -m "home-ledger + changelog-reset: surface the Home ledger; seed canonical CHANGELOG" && git push
```

If `home-ledger` is **already pushed**, ship this on its own:

```bash
git add -A && git commit -m "changelog-reset: replace foreign extend changelog with canonical Surreel changelog" && git push
```

## Cleanup

The Drop-in already moved the patch → `ship-scripts/` and README → `ship-readmes/`. Optional sweep:

```bash
find ~/Downloads ~/Desktop -maxdepth 3 -name "patch_changelog_reset.py" -delete 2>/dev/null; echo "swept"
```

## Verification (no UI surface)

1. `cat CHANGELOG.md` — top line reads `# Surreel — Changelog`, then `home-ledger` then `repo-scaffold`.
2. Optional: swap the `(this push)` line under `home-ledger` for the real short SHA after you push (`git rev-parse --short HEAD`). Cosmetic — leave it if you prefer.
3. Confirm `2b59b57` is the line under `repo-scaffold` (the real scaffold commit).

## What this ship does NOT cover

- **Back-filling pre-scaffold history.** Surreel ran for months before this log; those ships are not reconstructed (they live in git). The curated log starts at the reorg by design.
- **Any code / UI / schema change** — none. This is canonical-state repair only.
- **The `home-ledger` commit SHA** is left as `(this push)` rather than guessed — fill it post-push if you want it exact.

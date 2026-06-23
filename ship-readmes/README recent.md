# README — surreel recent

**2026-06-22 · Home · A Recently watched strip — last 3 in-period screenings, giving the dashboard a living feed.**

Display plus one pure engine helper. No migration. Builds on `reel-reads` (current `main`).

## What this ships

| # | Change | Cause |
|---|--------|-------|
| 1 | **Recently watched** strip on Home (below Best Value, above The Reel Story): up to 3 most-recent in-period screenings — poster, title, `theater · date`, and saved — each row links to its detail | The page read clean but static. The critique's "living quality" fix. |
| 2 | `screeningSavedCents()` added to `src/engine/savings.ts` (pure, integer cents) | Per-row saved = `(ticket_value + additional_tickets_value) − (amount_paid + additional_tickets_cost)`. Same per-screening basis as Best Value; engine-owned, not computed in the view. |
| — | Saved chip is signed and colored (green positive / red negative) | A full-price row with no discount can net negative; the strip shows that honestly rather than always green. |

Period-scoped (follows the PeriodSwitcher) like the rest of Home. Engine 2×2 and `computeSavings` untouched.

## Files in this bundle

```
patch_recent.py   → run in place (CHANGELOG.md + src/engine/savings.ts + src/pages/Home.tsx)
README recent.md  → ship-readmes/ (archived by the Drop-in)
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

patch = find("patch_recent.py")
if patch:
    print("running " + patch.name)
    subprocess.run(["python3", str(patch)], check=True)
    shutil.move(str(patch), str(SCRIPTS / patch.name))
    print("archived " + patch.name + " -> ship-scripts/")
else:
    print("patch_recent.py not found in Downloads/Desktop")

readme = find("README recent.md")
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
grep -q "Recently watched" src/pages/Home.tsx && \
grep -q "screeningSavedCents" src/engine/savings.ts && \
grep -q "recent" CHANGELOG.md && \
echo "change present"
```

## Ship to GitHub

```bash
cd ~/Developer/surreel && git status
```

```bash
git add -A && git commit -m "recent: Recently watched strip on Home" && git push
```

## Cleanup

**New standard sweep** (replaces the old one-name `-delete`). Removes ship artifacts from Downloads/Desktop **only if already archived** in the repo — so an un-run download is never lost — plus empty `files/` download-wrappers. Personal files (PDFs, screenshots, stray `.md`) are untouched. Re-runnable anytime:

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

1. Wait ~1–2 min for Cloudflare, then hard-refresh `https://surreel.pages.dev` in Safari (⌘⇧R).
2. A **Recently watched** card sits below Best Value and above The Reel Story.
3. It lists your most recent screenings (up to 3, newest first): small poster, title, a `theater · date` line (e.g. `AMC Pembroke Lakes 9 · Jun 14`), and a saved figure on the right — green when positive, red if a row netted negative.
4. Tapping a row opens that screening's detail (`/movie/:id`).
5. With your current 2 movies you should see 2 rows, ordered newest first; no blank/`undefined` lines, and the date matches the showtime.
6. Check **iPhone Safari** — title truncates cleanly, the row stays single-line on a narrow screen.

## What this ship does NOT cover

- **When I Watched empty-state** (mini-calendar of watched days) — still deferred; the takeaway line is the only softening there.
- **Break-even / membership-pace module** and **desktop left rail** — still out of scope / deferred.
- **A dedicated "all screenings" feed** — the strip is a 3-item peek, not a full list; Movies already serves the full log.

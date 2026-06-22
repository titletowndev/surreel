#!/usr/bin/env python3
"""
fix_screening_detail.py -- Surreel: fix the TS18047 build error.

Converts the hoisted `onDelete` function declaration to a `const` arrow so the
`if (!s) return` null-narrowing carries into it. Idempotent.

Usage: python3 fix_screening_detail.py            (targets ~/Developer/surreel)
       python3 fix_screening_detail.py /path/to/repo
"""
import os
import sys

REPO = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/Developer/surreel")
PATH = os.path.join(REPO, "src", "pages", "ScreeningDetail.tsx")

OLD = (
    "  async function onDelete() {\n"
    '    if (!confirm("Delete this screening? This cannot be undone.")) return;\n'
    "    await deleteScreening(s.id);\n"
    '    navigate("/movies");\n'
    "  }"
)
NEW = (
    "  const onDelete = async () => {\n"
    '    if (!confirm("Delete this screening? This cannot be undone.")) return;\n'
    "    await deleteScreening(s.id);\n"
    '    navigate("/movies");\n'
    "  };"
)


def main():
    if not os.path.isfile(PATH):
        sys.exit(f"ERROR: {PATH} not found")
    with open(PATH) as f:
        src = f.read()

    if "const onDelete = async ()" in src:
        print("Already fixed (onDelete is a const arrow). Nothing to do.")
        return

    n = src.count(OLD)
    if n != 1:
        sys.exit(f"ERROR: onDelete anchor found {n} times (expected 1). No change written.")

    with open(PATH, "w") as f:
        f.write(src.replace(OLD, NEW, 1))
    print("Fixed: onDelete converted to a const arrow.")
    print("\nNext:")
    print("  npm run build")
    print('  git add -A && git commit -m "Fix ScreeningDetail null-narrowing" && git push')


if __name__ == "__main__":
    main()

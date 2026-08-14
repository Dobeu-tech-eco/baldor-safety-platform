#!/usr/bin/env python3
"""Install packaged skills into Cursor's global skills directory."""

import os
import shutil
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from validate import validate_skill

CURSOR_SKILLS_DIR = os.path.expanduser("~/.cursor/skills-cursor")
PACK_SKILLS_DIR = os.path.join(os.path.dirname(__file__), "..", "skills")


def install_skill(src_dir, dest_root):
    name = os.path.basename(src_dir.rstrip("/"))
    errors = validate_skill(src_dir)
    if errors:
        return f"SKIP {name}: {errors}"
    dest = os.path.join(dest_root, name)
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.copytree(src_dir, dest)
    return f"OK {name}"


def main():
    os.makedirs(CURSOR_SKILLS_DIR, exist_ok=True)
    results = []
    for entry in sorted(os.listdir(PACK_SKILLS_DIR)):
        skill_dir = os.path.join(PACK_SKILLS_DIR, entry)
        if os.path.isdir(skill_dir):
            results.append(install_skill(skill_dir, CURSOR_SKILLS_DIR))
    for result in results:
        print(result)
    installed = sum(1 for result in results if result.startswith("OK"))
    print(f"Installed {installed} skills to {CURSOR_SKILLS_DIR}")
    return 0 if installed else 1


if __name__ == "__main__":
    sys.exit(main())

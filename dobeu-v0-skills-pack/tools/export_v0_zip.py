#!/usr/bin/env python3
"""Build a v0.app-compatible skills ZIP.

v0 expects each skill as a top-level folder in the archive with a SKILL.md file.
It does NOT accept a nested `skills/` wrapper or non-skill folders like `manifest/`.
"""

import os
import sys
import zipfile

sys.path.insert(0, os.path.dirname(__file__))
from validate import validate_skill

SKILLS_ROOT = os.path.join(os.path.dirname(__file__), "..", "skills")
DEFAULT_OUTPUT = os.path.join(os.path.dirname(__file__), "..", "dobeu-v0-skills-pack-v0.zip")
ZIP_EPOCH = (1980, 1, 1, 0, 0, 0)


def _add_file(archive, abs_path, arcname):
    info = zipfile.ZipInfo(arcname, ZIP_EPOCH)
    info.compress_type = zipfile.ZIP_DEFLATED
    with open(abs_path, "rb") as handle:
        data = handle.read()
    archive.writestr(info, data)


def export_v0_zip(output_path=DEFAULT_OUTPUT, skills_root=SKILLS_ROOT):
    skills_root = os.path.abspath(skills_root)
    output_path = os.path.abspath(output_path)
    included = []
    errors = []

    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for entry in sorted(os.listdir(skills_root)):
            skill_dir = os.path.join(skills_root, entry)
            if not os.path.isdir(skill_dir):
                continue
            skill_errors = validate_skill(skill_dir)
            if skill_errors:
                errors.append((entry, skill_errors))
                continue
            for root, _dirs, files in os.walk(skill_dir):
                for file_name in files:
                    abs_path = os.path.join(root, file_name)
                    rel_path = os.path.relpath(abs_path, skills_root)
                    _add_file(archive, abs_path, rel_path)
            included.append(entry)

    print(f"Wrote {output_path}")
    print(f"Included {len(included)} skills")
    if errors:
        print(f"Skipped {len(errors)} invalid skills")
        for name, skill_errors in errors[:5]:
            print(f"  {name}: {skill_errors[0]}")
    return 0 if included and not errors else 1


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUTPUT
    sys.exit(export_v0_zip(out))

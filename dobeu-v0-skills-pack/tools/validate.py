import os
import re
import sys

import yaml

NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MAX_BYTES = 2 * 1024 * 1024


def _frontmatter(path):
    text = open(path, encoding="utf-8", errors="replace").read()
    match = re.match(r"^---\n(.*?)\n---\n?", text, re.S)
    if not match:
        return None
    try:
        return yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError:
        return None


def validate_skill(skill_dir):
    errors = []
    folder = os.path.basename(skill_dir.rstrip("/"))
    md = os.path.join(skill_dir, "SKILL.md")
    if not os.path.isfile(md):
        return [f"{folder}: missing SKILL.md"]
    fm = _frontmatter(md)
    if fm is None:
        return [f"{folder}: missing or unparsable YAML frontmatter"]
    name = fm.get("name")
    desc = fm.get("description")
    if not isinstance(name, str) or not name:
        errors.append(f"{folder}: frontmatter 'name' missing")
    else:
        if not NAME_RE.match(name):
            errors.append(f"{folder}: name '{name}' fails lowercase-hyphen regex")
        if name != folder:
            errors.append(f"{folder}: name '{name}' does not match folder name")
    if not isinstance(desc, str) or not desc.strip():
        errors.append(f"{folder}: frontmatter 'description' missing or empty")
    for root, _dirs, files in os.walk(skill_dir):
        for file_name in files:
            path = os.path.join(root, file_name)
            if os.path.getsize(path) > MAX_BYTES:
                errors.append(f"{folder}: {file_name} exceeds 2 MB")
            with open(path, "rb") as handle:
                if b"\x00" in handle.read(8192):
                    errors.append(f"{folder}: {file_name} appears binary")
    return errors


def main(skills_root):
    all_errors = []
    entries = sorted(os.listdir(skills_root))
    for entry in entries:
        skill_dir = os.path.join(skills_root, entry)
        if os.path.isdir(skill_dir):
            all_errors += validate_skill(skill_dir)
    for error in all_errors:
        print("ERROR:", error)
    print(f"Checked {len(entries)} folders, {len(all_errors)} errors")
    return 1 if all_errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "skills"))

import csv
import os
import re
import shutil
import sys

sys.path.insert(0, os.path.dirname(__file__))
from validate import NAME_RE, _frontmatter, validate_skill

DEST = "skills"


def compliant_name(raw):
    name = re.sub(r"[^a-z0-9-]+", "-", raw.lower()).strip("-")
    name = re.sub(r"-{2,}", "-", name)
    return name if NAME_RE.match(name) else None


def copy_skill(src, origin, license_str):
    fm = _frontmatter(os.path.join(src, "SKILL.md")) or {}
    name = compliant_name(str(fm.get("name") or os.path.basename(src)))
    if not name:
        return f"SKIP {src}: cannot derive compliant name"
    dst = os.path.join(DEST, name)
    if os.path.exists(dst):
        return f"SKIP {src}: duplicate name {name}"
    shutil.copytree(src, dst)
    md = os.path.join(dst, "SKILL.md")
    text = open(md, encoding="utf-8").read()
    if f"name: {name}" not in text:
        text = re.sub(
            r"^(---\n(?:.*\n)*?)name:\s*.*$",
            rf"\1name: {name}",
            text,
            count=1,
            flags=re.M,
        )
    if origin != "dobeu":
        end = text.index("---", 3) + 4
        attrib = (
            f"<!-- Source: {origin}/{os.path.basename(src)}; "
            f"license: {license_str or 'see origin'}; "
            f"repackaged for Dobeu Tech Solutions pack 2026-08-13 -->\n"
        )
        text = text[:end] + attrib + text[end:]
    open(md, "w", encoding="utf-8").write(text)
    scripts = os.path.join(dst, "scripts")
    if os.path.isdir(scripts):
        shutil.rmtree(scripts)
    _strip_non_text_assets(dst)
    errors = validate_skill(dst)
    if errors:
        shutil.rmtree(dst)
        return f"INVALID {name}: {errors}"
    return f"OK {name}"


def _strip_non_text_assets(skill_dir):
    for root, _dirs, files in os.walk(skill_dir):
        for file_name in files:
            path = os.path.join(root, file_name)
            if os.path.getsize(path) > 2 * 1024 * 1024:
                os.remove(path)
                continue
            with open(path, "rb") as handle:
                if b"\x00" in handle.read(8192):
                    os.remove(path)


def main():
    os.makedirs(DEST, exist_ok=True)
    results = []
    audit_path = os.path.join(os.path.dirname(__file__), "..", "manifest", "audit.csv")
    with open(audit_path, newline="", encoding="utf-8") as handle:
        for row in list(csv.reader(handle))[1:]:
            if row[3] == "include-copy":
                results.append(copy_skill(row[0], row[2], row[5]))
    print("\n".join(results))
    print(
        f"{sum(1 for result in results if result.startswith('OK'))} packaged, "
        f"{sum(1 for result in results if not result.startswith('OK'))} problems"
    )


if __name__ == "__main__":
    os.chdir(os.path.join(os.path.dirname(__file__), ".."))
    main()

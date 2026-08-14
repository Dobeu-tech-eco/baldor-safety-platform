import csv
import glob
import os
import re
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(__file__))
from validate import _frontmatter

DOBEU_REPO = os.environ.get("DOBEU_SKILLS_REPO", "/tmp/dobeu-claude-skills/skills")
CURSOR_PLUGINS = os.environ.get(
    "CURSOR_PLUGINS_ROOT", "/home/ubuntu/.cursor/plugins/cache"
)

ALLOWED_LICENSES = {
    "MIT",
    "Apache-2.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "CC0-1.0",
    "CC-BY-4.0",
}

TOOL_MARKERS = re.compile(
    r"(mcp__[a-z0-9_]+|allowed-tools|COMPOSIO_|scripts/[a-zA-Z0-9_./-]+\.(py|sh|js)"
    r"|\bBash\(|npx\s+(?!create-next-app)[a-z@][a-z0-9@/._-]+|subagent|Task tool)",
    re.I,
)

DOMAIN = re.compile(
    r"(design|ui|ux|frontend|react|next\.?js|tailwind|shadcn|css|component|layout|landing"
    r"|typograph|color|palette|accessib|wcag|aria|copywrit|seo|schema markup|brand|logo"
    r"|hero|dashboard|chart|visualiz|web app|website|page|style|theme|v0)",
    re.I,
)

CANDIDATE_PLUGIN_HINTS = re.compile(
    r"(ui-design|frontend|accessibility|design|javascript|typescript|seo|marketing|react|shadcn|figma|vercel|cursor-public)",
    re.I,
)

KNOWN_V0_SKILL_NAMES = {
    "shadcn",
    "nextjs",
    "react-best-practices",
    "next-best-practices",
    "web-design-guidelines",
    "vercel-react-best-practices",
    "vercel-composition-patterns",
    "vercel-react-view-transitions",
    "frontend-design",
    "accessibility-compliance",
    "create-plugin-scaffold",
}


def plugin_license(plugin_root):
    for fname in ("LICENSE", "LICENSE.md", "LICENSE.txt"):
        path = os.path.join(plugin_root, fname)
        if os.path.isfile(path):
            head = open(path, encoding="utf-8", errors="replace").read(400)
            if "MIT" in head:
                return "MIT"
            if "Apache" in head:
                return "Apache-2.0"
            if "BSD" in head:
                return "BSD"
    return ""


def discover_cursor_plugin_skills():
    rows = []
    pattern = os.path.join(CURSOR_PLUGINS, "**", "skills", "*")
    for skill_dir in sorted(glob.glob(pattern, recursive=True)):
        if not os.path.isdir(skill_dir):
            continue
        md = os.path.join(skill_dir, "SKILL.md")
        if not os.path.isfile(md):
            continue
        skills_root = os.path.dirname(skill_dir)
        plugin_root = os.path.dirname(skills_root)
        rel_path = os.path.relpath(skill_dir, CURSOR_PLUGINS)
        plugin_context = rel_path.split(os.sep)[0:-2]
        plugin_name = "/".join(plugin_context)
        plugin_context_str = "/".join(plugin_context).lower()
        skill_name = os.path.basename(skill_dir)
        if (
            skill_name not in KNOWN_V0_SKILL_NAMES
            and not CANDIDATE_PLUGIN_HINTS.search(plugin_context_str)
        ):
            fm = _frontmatter(md) or {}
            rows.append(
                (
                    skill_dir,
                    str(fm.get("name") or os.path.basename(skill_dir)),
                    f"plugin:{plugin_name}",
                    "exclude",
                    "C3 fail: plugin outside v0 candidate set",
                    "",
                )
            )
            continue
        license_str = plugin_license(plugin_root)
        result = audit_one(skill_dir, f"plugin:{plugin_name}", license_str)
        if result:
            rows.append(result)
    return rows


def discover_dobeu_repo_skills():
    rows = []
    if not os.path.isdir(DOBEU_REPO):
        return rows
    for entry in sorted(os.listdir(DOBEU_REPO)):
        skill_dir = os.path.join(DOBEU_REPO, entry)
        if not os.path.isdir(skill_dir):
            continue
        origin = "dobeu" if entry.startswith("dobeu-") else "personal"
        result = audit_one(skill_dir, origin)
        if result:
            rows.append(result)
    return rows


def audit_one(skill_dir, origin, plugin_lic=""):
    md = os.path.join(skill_dir, "SKILL.md")
    if not os.path.isfile(md):
        return None
    fm = _frontmatter(md) or {}
    name = str(fm.get("name") or os.path.basename(skill_dir))
    desc = str(fm.get("description") or "")
    body = open(md, encoding="utf-8", errors="replace").read()
    lic = str(fm.get("license") or plugin_lic or "")
    tool_hits = sorted({match.group(0)[:30] for match in TOOL_MARKERS.finditer(body)})[:5]
    domain_ok = bool(DOMAIN.search(name + " " + desc))
    if origin == "dobeu":
        return (
            skill_dir,
            name,
            origin,
            "include-copy",
            "Dobeu-owned, v0-native",
            "proprietary-dobeu",
        )
    if tool_hits:
        return (
            skill_dir,
            name,
            origin,
            "exclude",
            "C2 fail: requires " + "; ".join(tool_hits),
            lic,
        )
    if not domain_ok:
        return (skill_dir, name, origin, "exclude", "C3 fail: not v0 domain", lic)
    if origin == "personal":
        return (
            skill_dir,
            name,
            origin,
            "include-copy",
            "personal, instruction-only, domain fit",
            lic or "personal",
        )
    if lic in ALLOWED_LICENSES or lic == "BSD":
        return (
            skill_dir,
            name,
            origin,
            "include-copy",
            "plugin skill, permissive license",
            lic,
        )
    return (
        skill_dir,
        name,
        origin,
        "reference-public",
        "C4: no redistribution license; add by reference if on skills.sh, else drop",
        lic or "unknown",
    )


def main():
    rows = discover_dobeu_repo_skills() + discover_cursor_plugin_skills()
    os.makedirs("manifest", exist_ok=True)
    with open("manifest/audit.csv", "w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            ["source_path", "skill_name", "origin", "decision", "reason", "license"]
        )
        writer.writerows(rows)
    print(Counter(row[3] for row in rows))
    print(f"Wrote manifest/audit.csv ({len(rows)} rows)")


if __name__ == "__main__":
    os.chdir(os.path.join(os.path.dirname(__file__), ".."))
    main()

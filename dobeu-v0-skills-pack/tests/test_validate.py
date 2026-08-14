import os
import sys
import tempfile
import textwrap

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
from validate import validate_skill


def make_skill(root, folder, content):
    skill_dir = os.path.join(root, folder)
    os.makedirs(skill_dir)
    with open(os.path.join(skill_dir, "SKILL.md"), "w", encoding="utf-8") as handle:
        handle.write(textwrap.dedent(content))
    return skill_dir


def test_valid_skill_passes():
    with tempfile.TemporaryDirectory() as root:
        skill_dir = make_skill(
            root,
            "good-skill",
            """\
            ---
            name: good-skill
            description: Does X. Use when Y.
            ---
            # Body
            """,
        )
        assert validate_skill(skill_dir) == []


def test_name_mismatch_fails():
    with tempfile.TemporaryDirectory() as root:
        skill_dir = make_skill(
            root,
            "folder-a",
            "---\nname: other-name\ndescription: d\n---\nbody\n",
        )
        assert any("name" in error for error in validate_skill(skill_dir))


def test_missing_description_fails():
    with tempfile.TemporaryDirectory() as root:
        skill_dir = make_skill(
            root,
            "no-desc",
            "---\nname: no-desc\n---\nbody\n",
        )
        assert any("description" in error for error in validate_skill(skill_dir))


def test_bad_name_chars_fail():
    with tempfile.TemporaryDirectory() as root:
        skill_dir = make_skill(
            root,
            "Bad_Name",
            "---\nname: Bad_Name\ndescription: d\n---\nbody\n",
        )
        assert any("regex" in error or "lowercase" in error for error in validate_skill(skill_dir))


def test_oversize_file_fails():
    with tempfile.TemporaryDirectory() as root:
        skill_dir = make_skill(
            root,
            "big-skill",
            "---\nname: big-skill\ndescription: d\n---\nbody\n",
        )
        with open(os.path.join(skill_dir, "big.txt"), "w", encoding="utf-8") as handle:
            handle.write("x" * (2 * 1024 * 1024 + 1))
        assert any("2 MB" in error for error in validate_skill(skill_dir))


def test_binary_file_fails():
    with tempfile.TemporaryDirectory() as root:
        skill_dir = make_skill(
            root,
            "bin-skill",
            "---\nname: bin-skill\ndescription: d\n---\nbody\n",
        )
        with open(os.path.join(skill_dir, "img.png"), "wb") as handle:
            handle.write(b"\x89PNG\x00\x01")
        assert any("binary" in error for error in validate_skill(skill_dir))

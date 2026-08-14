# Creating the pack (you do this once — ~3 minutes)

1. Open https://skills.sh/packs and click **Create pack**. Sign in with your Vercel
   account (the one that owns the **Dobeu Tech Solutions LLC** team).
2. Name: `dobeu-v0-pack`. Description: `Dobeu Tech Solutions design + frontend skills
   for v0.app`. Team: **Dobeu Tech Solutions LLC**.
3. Add skills — two sources:
   a. **GitHub repo:** add `dobeutech/dobeu-v0-skills-pack` (every folder under
      `skills/` is picked up; invalid files are auto-skipped).
      — OR upload `dobeu-v0-skills-pack.zip` if you prefer not to link GitHub.
   b. **Public skills:** search and add each entry in `manifest/pack-ui-add-list.md`
      (the curated Vercel skills + any of your style skills that are already public).
4. Click create, then copy the install command shown:
   `npx skills add https://skills.sh/p/<pack-id>` — paste it back for post-creation verification.

# Using it in v0.app

## Import via ZIP (team or personal skills)

v0 expects **each skill as a top-level folder** in the ZIP, with a `SKILL.md` inside
each folder. It does **not** accept a nested `skills/` wrapper or extra folders like
`manifest/`.

Use the v0-specific export (not `dobeu-v0-skills-pack.zip`):

```bash
python3 tools/export_v0_zip.py
```

Upload **`dobeu-v0-skills-pack-v0.zip`** in v0 → Settings → Skills → Import skills from ZIP.

Expected layout inside the ZIP:

```
brand-guidelines/SKILL.md
nextjs/SKILL.md
react-best-practices/SKILL.md
...
```

## Other ways to use skills in v0

- v0 Skills menu → **Teams** section: team-shared skills for Dobeu Tech Solutions LLC
  appear here; **My skills** shows your personal ones; attach a skill to any prompt.
- If a pack skill does not appear under Teams automatically, use **Explore skills** →
  search its name, or attach the skill to a prompt directly.

# Using it in Cursor

Run from this repo:

```bash
python3 tools/install_to_cursor.py
```

This copies validated skills into `~/.cursor/skills-cursor/` where Cursor discovers them.

# Warning

Packs are UNLISTED, not private — anyone with the URL can view and install. This repo
contains no secrets (verified by secret scan). Keep it that way.

# Missing from this build

The proprietary skills `dobeu-v0-design` and `dobeu-figma-make-design` referenced in the
original spec were not present in this cloud environment (`/root/.claude/skills/synced`).
Add them manually from your local synced skills folder, then re-run:

```bash
python3 tools/audit.py && python3 tools/package.py && python3 tools/install_to_cursor.py
```

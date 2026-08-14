# Dobeu Tech Solutions — Design System

> **The single source of truth for the entire Dobeu Ecosystem.** Every sub-brand (dobeu.dev, dobeu.net, dobeu.online, dobeu.io, …) ships from this one kit. One mark. One wordmark. One palette. One type family. Sub-brands differentiate only by **TLD accent color** and **tagline**.

Dobeu Tech Solutions is a software-review and technology-services ecosystem spanning **17 sub-brand domains**. A single mark, palette, and type family flex across five product surfaces:

1. **Consumer review sites** (dobeu.net) — "Simplify your software decisions"
2. **Developer tools & portals** (dobeu.dev) — "Your AI pair programmer"
3. **SaaS dashboards / analytics platforms**
4. **Marketplace services**
5. **Freight & logistics mobile tools**

Dark mode is the default for developer products; light mode for consumer products.

**Brand personality:** approachable, trustworthy, simple — *"a knowledgeable friend, not a corporate entity."* The visual DNA is warm indigo + amber, soft rounded corners, no gradients, no drop-shadows on hero elements, and one signature motif: **The Overlap** — two overlapping circles with an amber lens at their intersection.

---

## 1. The Logo

The Dobeu logo is the canonical mark for every product, surface, and sub-brand. Differentiation happens via the TLD accent color on the wordmark — never by changing the symbol.

### Anatomy — "The Overlap"

Two soft, slightly-organic circles that pass through each other. Where they meet, an amber crescent ("the lens") sits on top.

| Element | Color | Token |
|---|---|---|
| Left circle | `#6B5CE7` Indigo Primary | `--brand-indigo-primary` |
| Right circle | `#5A4FAB` Indigo Slate | `--brand-indigo-slate` |
| Center lens | `#F4A261` Amber Warm | `--brand-amber-warm` |
| Wordmark `dobeu` | `#5A4FAB` Indigo Slate | `--brand-indigo-slate` |

The wordmark is **Nunito ExtraBold (800)**, all-lowercase, custom-tightened. Do not retype it — use the PNG/SVG masters.

### Construction & clear space

- **Clear space:** minimum `0.25 × mark-height` on every side. Nothing enters this margin.
- **Minimum size:** icon-only mark never below **20px**; stacked lockup never below **96px tall**. Below that, use the icon-only mark with no wordmark.
- **Never** redraw, recolor, rotate, skew, outline, gradient, or animate the mark. Never separate the lens from the circles. Never place the mark inside a container shape.

### When to use which

| Need | Use |
|---|---|
| App icon, favicon, social avatar | `mark-500-transparent.png` (or `favicon-512.png`) |
| Marketing hero, login, splash | `logo-stacked.png` (symbol over wordmark) |
| Navbar / app header | Mark + typed wordmark (Nunito 800), wordmark in `--fg-heading` |
| Print, email signature | `dobeu-logo.png` (horizontal banner) |
| OG image / social card | `assets/og-card-dobeu-{net,dev}.png` |

### Sub-brand differentiation — per-URL color schemes

The mark **shape never changes.** Each sub-brand recolors the three logo regions and adjusts surface defaults. Match by URL pattern, not component name — apply a `.brand-{tld}` class to the page root.

| URL pattern | Default mode | Primary (left) | Slate (right) | Lens | Surface |
|---|---|---|---|---|---|
| `*.dobeu.tech/*` (parent) | Light | `#6B5CE7` | `#5A4FAB` | `#F4A261` | `#1A1A2E` |
| `*.dobeu.dev/*` (developer) | Dark | `#4F6BE8` | `#2D3F7A` | `#F4A261` | `#0F1A33` |
| `*.dobeu.net/*` (consumer) | Light | `#7F6FD8` | `#7459A8` | `#F4A261` | `#FFF8F0` |
| `*.dobeu.ai/*` (ML) | Dark | `#3F8CB8` | `#2A4D6E` | `#D89544` | `#0E2230` |
| `*.dobeu.io/*` (logistics) | Dark / Light | `#4FA763` | `#2D5F30` | `#F4A261` | `#0E1F12` |

**Constant across every variant:** mark silhouette, wordmark typography (Nunito ExtraBold lowercase; UI chrome wordmark stays slate `#5A4FAB`, only the TLD suffix takes the accent), an amber-family lens, clear-space & minimum-size rules, and all type / spacing / radius tokens.

```html
<span class="word">dobeu</span><span class="tld brand-dev">.dev</span>
<span class="word">dobeu</span><span class="tld brand-net">.net</span>
```

The `.tld` color is bound to `--tld-accent`, which each `.brand-*` class redefines:

```css
.brand-dev    { --tld-accent: var(--brand-amber-warm); }      /* developer → amber */
.brand-net    { --tld-accent: var(--brand-indigo-primary); }  /* consumer  → indigo */
.brand-online { --tld-accent: var(--brand-indigo-deep); }     /* services  → deep indigo */
.brand-io     { --tld-accent: var(--semantic-success); }      /* infra     → green */
```

---

## 2. Color

Seven brand primitives + three semantic + two neutrals. All three brand purples come directly from the logo. **CTA swap is the core contrast trick:** indigo in light mode, amber in dark mode — the CTA always reads against its surface.

### Brand primitives

| Token | Hex | Role |
|---|---|---|
| `--brand-indigo-primary` | `#6B5CE7` | Mark's left circle; dominant color, light-mode CTA, default links |
| `--brand-indigo-slate` | `#5A4FAB` | Mark's right circle + wordmark; light-mode headings (`--fg-heading`) |
| `--brand-indigo-deep` | `#4A3FA8` | Legacy / pressed states. Reserved — not a heading color |
| `--brand-amber-warm` | `#F4A261` | Mark's center lens; rating stars, dark-mode CTA, dev TLD accent |
| `--brand-cream-soft` | `#FFF8F0` | Light-mode secondary surface (cards) |
| `--brand-dark-surface` | `#1A1A2E` | Dark-mode page background |
| `--brand-dark-elevated` | `#242440` | Dark-mode card surface |
| `--brand-text-gray` | `#2D2D3A` | Body copy, light mode |
| `--brand-body-text-dark` | `#E0E0E0` | Body copy, dark mode |

### Tints, borders & code surfaces

| Token | Hex |
|---|---|
| `--brand-tint-indigo-10` | `#E8E5FA` |
| `--brand-tint-amber-10` | `#FEF0E0` |
| `--brand-neutral-gray` | `#F5F5F7` |
| `--brand-border-light` | `#E0DFF5` |
| `--brand-border-dark` | `#2A2A45` |
| `--brand-code-bg-light` | `#F5F5F7` |
| `--brand-code-bg-dark` | `#0D0D1A` |

### Semantic & neutral

| Token | Hex |
|---|---|
| `--semantic-success` | `#4CAF50` |
| `--semantic-warning` | `#F4A261` |
| `--semantic-error` | `#E07A5F` |
| `--neutral-white` | `#FFFFFF` |
| `--neutral-black` | `#000000` |

### Semantic aliases (dark = default, light = flip)

| Alias | Dark (default) | Light |
|---|---|---|
| `--bg-primary` | `#1A1A2E` | `#FFFFFF` |
| `--bg-secondary` | `#242440` | `#FFF8F0` |
| `--bg-code` | `#0D0D1A` | `#F5F5F7` |
| `--fg-primary` | `#FFFFFF` | `#2D2D3A` |
| `--fg-body` | `#E0E0E0` | `#2D2D3A` |
| `--fg-heading` | `#6B5CE7` | `#5A4FAB` |
| `--fg-link` | `#6B5CE7` | `#6B5CE7` |
| `--fg-muted` | `#9A9AB0` | `#888888` |
| `--cta-bg` | `#F4A261` (amber) | `#6B5CE7` (indigo) |
| `--cta-fg` | `#2D2D3A` | `#FFFFFF` |
| `--border-default` | `#2A2A45` | `#E0DFF5` |

> **Slate vs. deep:** the current wordmark sits at Slate `#5A4FAB` — lighter and warmer than the legacy Deep `#4A3FA8`. Headings now match the wordmark exactly. Migrate old `#4A3FA8` type to slate.

---

## 3. Typography

- **Primary:** **Nunito** (400 / 500 / 600 / 700 / 800) — warm rounded humanist. Load from Google Fonts. Fallback: Quicksand.
- **Mono:** **JetBrains Mono** (400 / 500 / 700) — code, token values, dev-portal UI.

```
--font-sans: "Nunito", "Quicksand", ui-sans-serif, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

### Type scale

| Style | Size | Line height | Weight | Notes |
|---|---|---|---|---|
| Display | 48px | 1.05 | 800 | tracking −0.02em |
| H1 | 36px | 1.10 | 800 | tracking −0.01em |
| H2 | 28px | 1.15 | 700 | tracking −0.005em |
| H3 | 22px | 1.20 | 700 | |
| H4 | 18px | 1.30 | 700 | |
| Body | 16px | 1.55 | 400 | |
| Small | 14px | 1.50 | 400 | |
| Label | 12px | 1.20 | 700 | UPPERCASE, tracking 0.08em |
| Code | 13px | 1.55 | — | JetBrains Mono |

Weight tokens: `--fw-regular 400`, `--fw-medium 500`, `--fw-semi 600`, `--fw-bold 700`, `--fw-extra 800`.

---

## 4. Spacing & Layout

**4pt grid:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 (`--space-1` … `--space-20`).

- Standard page gutter: **80px** on 1440+.
- Cards use **20px** internal padding (28px in the foundations hub layout).
- Navbars are **64px** tall, never taller.
- Buttons never stretch full-width except in mobile forms and modals.
- Amber is never used on large surfaces — only as an accent dot, bar, or dark-mode CTA.

---

## 5. Radii

Three sizes plus pill:

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Tags, badges, tight controls |
| `--radius-md` | 12px | Buttons, inputs, avatars |
| `--radius-lg` | 20px | Cards, modals, hero elements |
| `--radius-pill` | 999px | Rating chips, status pills |

---

## 6. Elevation & Shadows

Four-step scale, all soft/warm and tinted toward `rgba(26,26,46,*)` — never pure black, never above ~18% alpha.

| Token | Value |
|---|---|
| `--shadow-xs` | `0 1px 2px rgba(26,26,46,0.06)` |
| `--shadow-sm` | `0 2px 6px rgba(26,26,46,0.08)` |
| `--shadow-md` | `0 6px 18px rgba(26,26,46,0.10)` |
| `--shadow-lg` | `0 16px 40px rgba(26,26,46,0.14)` |
| `--shadow-ring-indigo` | `0 0 0 3px rgba(107,92,231,0.22)` |
| `--shadow-ring-amber` | `0 0 0 3px rgba(244,162,97,0.25)` |

Cards use `shadow-sm` at rest, `shadow-md` on hover. **No inner shadows** anywhere. No protection gradients.

---

## 7. Surfaces & Effects

- **Flat fills, no gradients.** Surfaces are solid color.
- **No photography in marketing** — the hero is always the mark on a flat dark or cream surface.
- Social banners use a **4px amber accent bar** along the bottom edge.
- No patterns, textures, or noise.
- **Borders:** always 1px solid. Light `#E0DFF5`, dark `#2A2A45`. No colored borders on cards except active/selected (indigo).
- **Backdrop blur** only on modals and toasts (`backdrop-filter: blur(12px)` + 60% overlay). Never transparency on cards, buttons, or navbars.

---

## 8. Motion & Interaction

- **Transitions:** 150–200ms `ease-out`. No bouncing, no spring, no scale pops.
- Fades + small 4–8px translates only. Page transitions are opacity-only. Rating stars fill instantly.
- **Hover:** background darkens ~6% (`filter: brightness(0.94)` on indigo, `1.05` on dark). No border color change on hover.
- **Press:** `translateY(1px)` + darker brightness. No scale.
- **Focus:** 3px indigo ring `rgba(107,92,231,0.22)` offset 2px. Always visible — never remove outlines.

---

## 9. Iconography

Dobeu does **not** ship a custom icon font. Use **[Lucide](https://lucide.dev)** via CDN — stroke-based, matching Nunito's warm-geometric personality.

```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="star" style="width:16px;height:16px;color:var(--accent-rating)"></i>
```

- **Stroke weight 1.5px**, rounded caps/joins.
- **Size scale:** 14 / 16 / 18 / 20 / 24. Buttons use 16; navbars use 20.
- **Color** always inherits from `currentColor` — never hardcode.
- Don't mix Lucide with Material Icons, Heroicons, or emoji on the same surface.
- The mark and SVG logos live in `assets/` as PNG — use as `<img>`, never redraw.
- **Emoji:** not used. Unicode-glyph icons: not used (exception: `×` for close).

---

## 10. Card Anatomy

- Background: `--bg-secondary` (cream in light, elevated in dark)
- Border: 1px `--border-default` **OR** `shadow-sm` — not both
- Radius: 20px (large) or 12px (compact list rows)
- Padding: 20px
- Title: H4 in `--fg-heading`; supporting body in `--fg-body`

---

## 11. Content & Voice

**Voice:** second-person, direct, confident, never salesy. Short sentences, plain words. The knowledgeable friend who used the software and tells you honestly whether it's any good — never hypes, never hedges, calls out tradeoffs.

- **Person:** say "you" and "we" — never "our users" or third-person marketing-speak.
- **Casing:** sentence case for UI labels, headings, buttons. `dobeu` and TLD always lowercase (`dobeu.dev`). Uppercase reserved for tiny meta labels (RATINGS · BADGES · TAGS).
- **Punctuation:** no exclamation marks in product UI. Ellipses only for loading. Em-dashes fine in marketing.
- **Emoji:** not used. The one "visual emoji" is the mark itself.
- **Numbers:** ratings render as numeric `4.8` + star icons, never `★★★★½`. Prices use currency symbols. Dates `Apr 24, 2026` for consumer, ISO `2026-04-24` for dev docs.

| Do | Don't |
|---|---|
| Simplify your software decisions | Revolutionize your SaaS procurement journey |
| Your AI pair programmer | Unlock next-gen AI-powered developer productivity |
| Honest software reviews | Crowdsourced ecosystem intelligence |
| We read the release notes so you don't have to | Stay ahead of the curve with our platform |

---

## 12. Multi-Brand Foundations (`data-brand`)

Beyond the five reference sub-brands, the foundations layer lets each domain declare its DNA via `[data-brand]` on `<html>` — overriding accent, secondary, and display/body fonts while keeping the shared spacing, radius, and shadow scales.

| `data-brand` | Accent | Secondary | Display font |
|---|---|---|---|
| `net` | `#6B5CE7` | `#F4A261` | Nunito |
| `info` | `#0EA5E9` | `#FCD34D` | Fraunces / Inter Tight |
| `dev` | `#10B981` | `#0F172A` | JetBrains Mono / Inter Tight |
| `tech` | `#8B5CF6` | `#22D3EE` | Space Grotesk |
| `icu` | `#EC4899` | `#0F172A` | Bricolage Grotesque / Manrope |
| `cloud` | `#3B82F6` | `#06B6D4` | Sora |
| `app` | `#F97316` | `#0F172A` | Outfit |
| `at` | `#14B8A6` | `#FACC15` | DM Sans |
| `shop` | `#E11D48` | `#FDE047` | Plus Jakarta Sans |
| `store` | `#7C3AED` | `#F472B6` | Cabinet Grotesk |
| `site` | `#F59E0B` | `#6366F1` | Spline Sans |
| `online` | `#06B6D4` | `#FB7185` | Manrope |
| `org` | `#059669` | `#0F172A` | IBM Plex Mono / Inter Tight |
| `website` | `#2563EB` | `#A855F7` | Sora / Inter Tight |

---

## 13. Consuming the System

Link the single entrypoint stylesheet — it imports both token layers:

```css
@import url("colors_and_type.css");     /* primitives, semantic tokens, type scale */
@import url("dobeu-foundations.css");    /* multi-brand hub + layout primitives */
```

```html
<link rel="stylesheet" href="styles.css">
```

Set mode with `data-mode="dark"` (default) or `data-mode="light"` on `:root`, and a sub-brand with `data-brand="…"` / `.brand-…` on the page root.

### File index

```
Dobeu-Design-System/
├── colors_and_type.css      ← primitives + semantic tokens + type scale
├── dobeu-foundations.css    ← multi-brand hub, layout & component primitives
├── styles.css               ← entrypoint (imports both)
├── assets/                  ← PNG brand kit (logos, marks, OG cards, banners)
├── preview/                 ← Design System tab cards
└── ui_kits/
    ├── dobeu-net/           ← consumer review site (light mode)
    └── dobeu-dev/           ← developer portal (dark mode)
```

---

## Surface Treatments (v1.1)

Three layered treatments in `dobeu-surfaces.css` (auto-loaded via `styles.css`). All use existing tokens — no new colors or fonts.

### Glassmorphism — menus & overlays
- `.dbu-glass` / `.dbu-glass-dark` — translucent panel, `blur(18px) saturate(1.5)`, cream/dark-elevated base, indigo-tinted border, `--radius-lg`
- `.dbu-glass-menu` + `.dbu-glass-menu-item` (`.is-active` state uses 16% indigo wash)
- Use for: navbars, dropdowns, command palettes, modals over imagery

### Premium — headers & highlighted text
- `.dbu-premium-heading` — indigo gradient-clipped display heading, -0.02em tracking, weight 800
- `.dbu-premium-accent` — amber word accent inside a gradient heading
- `.dbu-premium-eyebrow` — uppercase indigo kicker
- `.dbu-premium-highlight` — amber-tint marker behind key phrases
- `.dbu-premium-rule` — 56px indigo→amber gradient rule

### Material — paragraphs & text boxes
- `.dbu-material-card` — white sheet, `--radius-md`, `--shadow-sm` → `--shadow-md` on hover, 15px/1.65 body copy
- `.dbu-material-field` + `.dbu-material-label` — filled input, underline focus in `--brand-indigo-primary` with `--shadow-ring-indigo`
- Use for: long-form copy blocks, forms, comment boxes

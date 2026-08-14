# Component Inventory — Baldor Specialty Foods Design System

Source: `attached_assets/2026-8-14-baldordesignsysetem_1786701081702.md` (DESIGN.md equivalent)  
Extraction date: 2026-08-14  
Source kind: Spec-seeded (DESIGN.md §4 Components)

## Source component families

The spec documents 5 component families in §4. All 5 are pilot-implemented.

| Family | Slug | Scaffold component | Status | Chunk | Ref file |
|---|---|---|---|---|---|
| Button | `button` | `button.tsx` | implemented | pilot | `components/button.md` |
| Badge / Chip | `badge` | `badge.tsx` | implemented | pilot | `components/badge.md` |
| Card | `card` | `card.tsx` | implemented | pilot | `components/card.md` |
| Alert / Callout | `alert` | `alert.tsx` | implemented | pilot | `components/alert.md` |
| Eyebrow | `eyebrow` | `eyebrow.tsx` (new) | implemented | pilot | `components/eyebrow.md` |

## Notes

- All 5 families are source-backed from the DESIGN.md spec and implemented in the pilot chunk.
- Scaffold components were pruned to these 5 families; all others removed from `src/components/ui/`.
- Font substitutions: Ruder Plakat → Barlow Condensed · Herbik → DM Sans · FT Polar → Space Grotesk (proprietary originals not available).
- Chip category colors (gold/purple/sky) are spec-defined brand constants and do not respond to light/dark mode.

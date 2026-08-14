import { lazy, type ComponentType } from 'react';
import {
  ColorsPage,
  FontsPage,
  LayoutPage,
  OverviewPage,
} from './foundations';
import { LayoutPatternsPage } from './brand';
import { VoiceTonePage } from './content';

function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => ({ default: await load() }));
}

// ── Pilot component demos (lazy) ──────────────────────────────────────────
const ButtonDemo = lazyPage(() =>
  import('./demos/button').then(({ ButtonDemo }) => ButtonDemo),
);
const BadgeDemo = lazyPage(() =>
  import('./demos/badge').then(({ BadgeDemo }) => BadgeDemo),
);
const CardDemo = lazyPage(() =>
  import('./demos/card').then(({ CardDemo }) => CardDemo),
);
const AlertDemo = lazyPage(() =>
  import('./demos/alert').then(({ AlertDemo }) => AlertDemo),
);
const EyebrowDemo = lazyPage(() =>
  import('./demos/eyebrow').then(({ EyebrowDemo }) => EyebrowDemo),
);

// ── Design system metadata ────────────────────────────────────────────────

export interface DesignSystem {
  title: string;
  description: string;
}

export const DESIGN_SYSTEM: DesignSystem = {
  title: 'Baldor Specialty Foods Design System',
  description:
    'Editorial and confident — cream paper, deep forest greens, and lime. The visual language for marketing, driver communications, signage, and documents.',
};

// ── Preview entry type ────────────────────────────────────────────────────

export interface PreviewEntry {
  id: string;
  name: string;
  description?: string;
  Page: ComponentType;
}

export interface NavGroup {
  name: string;
  entries: PreviewEntry[];
}

// ── Overview (always first) ───────────────────────────────────────────────

export const OVERVIEW_ENTRY: PreviewEntry = {
  id: 'overview',
  name: 'Overview',
  description:
    'All five pilot components — Button, Badge/Chip, Card, Alert, Eyebrow — shown together with the Baldor palette.',
  Page: OverviewPage,
};

// ── Navigation groups ─────────────────────────────────────────────────────

export const NAV_GROUPS: NavGroup[] = [
  {
    name: 'Brand',
    entries: [
      {
        id: 'brand-layout-patterns',
        name: 'Layout patterns',
        description:
          'Three canvas types: cream editorial, forest comms canvas, poster/signage.',
        Page: LayoutPatternsPage,
      },
    ],
  },
  {
    name: 'Colors',
    entries: [
      {
        id: 'colors-palette',
        name: 'Color palette',
        description:
          'Greens spine, cream surface tones, lime accent, and semantic colors.',
        Page: ColorsPage,
      },
    ],
  },
  {
    name: 'Fonts',
    entries: [
      {
        id: 'fonts-type-scale',
        name: 'Type scale',
        description:
          'Barlow Condensed (display) · DM Sans (body) · Space Grotesk (accent kicker).',
        Page: FontsPage,
      },
    ],
  },
  {
    name: 'Layout',
    entries: [
      {
        id: 'layout-spacing-radius',
        name: 'Spacing, radius, shadows',
        description: '4pt grid · r-xs/sm/md/lg/xl/pill · ink-tinted shadow scale.',
        Page: LayoutPage,
      },
    ],
  },
  {
    name: 'Actions',
    entries: [
      {
        id: 'actions-buttons',
        name: 'Buttons',
        description:
          'Primary (green), CTA (lime), secondary, outline, ghost, link, safety/destructive.',
        Page: ButtonDemo,
      },
    ],
  },
  {
    name: 'Structure',
    entries: [
      {
        id: 'structure-cards',
        name: 'Cards',
        description:
          'Eyebrow → headline → body rhythm. Cream editorial and forest comms variants.',
        Page: CardDemo,
      },
    ],
  },
  {
    name: 'Data display',
    entries: [
      {
        id: 'data-display-badges',
        name: 'Badges / chips',
        description:
          'Local (gold), Featured (purple), Supply Update (sky) — uppercase tracked pill chips.',
        Page: BadgeDemo,
      },
      {
        id: 'data-display-eyebrow',
        name: 'Eyebrow',
        description:
          'Uppercase tracked label above headlines — muted or lime accent.',
        Page: EyebrowDemo,
      },
    ],
  },
  {
    name: 'Feedback',
    entries: [
      {
        id: 'feedback-alerts',
        name: 'Alerts',
        description:
          'Safety callout (squared, red), info/supply update (sky), default.',
        Page: AlertDemo,
      },
    ],
  },
  {
    name: 'Content',
    entries: [
      {
        id: 'content-voice',
        name: 'Voice and tone',
        description:
          'Direct, confident, plain. Imperative for instructions. Bilingual EN/ES for driver-facing copy.',
        Page: VoiceTonePage,
      },
    ],
  },
];

export const ALL_ENTRIES: PreviewEntry[] = [
  OVERVIEW_ENTRY,
  ...NAV_GROUPS.flatMap((group) => group.entries),
];

// Fail loudly on duplicate page ids — a dup makes one page unreachable.
const duplicateIds = ALL_ENTRIES.map((e) => e.id).filter(
  (id, index, ids) => ids.indexOf(id) !== index,
);
if (duplicateIds.length > 0) {
  throw new Error(
    `Duplicate preview page id(s): ${[...new Set(duplicateIds)].join(', ')}. Every page id must be unique.`,
  );
}

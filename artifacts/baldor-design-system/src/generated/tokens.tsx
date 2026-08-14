/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#FAF8F3",
      "foreground": "#182230",
      "border": "#E4E2DB",
      "card": "#FFFFFF",
      "cardForeground": "#182230",
      "popover": "#FFFFFF",
      "popoverForeground": "#182230",
      "primary": "#20491D",
      "primaryForeground": "#FAF8F3",
      "secondary": "#F1F0EC",
      "secondaryForeground": "#344054",
      "muted": "#F1F0EC",
      "mutedForeground": "#344054",
      "accent": "#B3CF44",
      "accentForeground": "#182230",
      "destructive": "#E00000",
      "destructiveForeground": "#FFFFFF",
      "input": "#E4E2DB",
      "ring": "#007050",
      "chart1": "#064725",
      "chart2": "#B3CF44",
      "chart3": "#5C4E71",
      "chart4": "#79B0C8",
      "chart5": "#F2A813",
      "sidebar": "#FAF8F3",
      "sidebarForeground": "#182230",
      "sidebarBorder": "#E4E2DB",
      "sidebarPrimary": "#20491D",
      "sidebarPrimaryForeground": "#FAF8F3",
      "sidebarAccent": "#F1F0EC",
      "sidebarAccentForeground": "#344054",
      "sidebarRing": "#007050"
    },
    "dark": {
      "background": "#20280B",
      "foreground": "#FAF8F3",
      "border": "#2D4020",
      "card": "#064725",
      "cardForeground": "#FAF8F3",
      "popover": "#08563F",
      "popoverForeground": "#FAF8F3",
      "primary": "#B3CF44",
      "primaryForeground": "#1E1B1D",
      "secondary": "#08563F",
      "secondaryForeground": "#FAF8F3",
      "muted": "#064725",
      "mutedForeground": "#96AB7A",
      "accent": "#F2A813",
      "accentForeground": "#1E1B1D",
      "destructive": "#E00000",
      "destructiveForeground": "#FFFFFF",
      "input": "#2D4020",
      "ring": "#B3CF44",
      "chart1": "#B3CF44",
      "chart2": "#F2A813",
      "chart3": "#79B0C8",
      "chart4": "#EE8B84",
      "chart5": "#5C4E71",
      "sidebar": "#20280B",
      "sidebarForeground": "#FAF8F3",
      "sidebarBorder": "#2D4020",
      "sidebarPrimary": "#B3CF44",
      "sidebarPrimaryForeground": "#1E1B1D",
      "sidebarAccent": "#064725",
      "sidebarAccentForeground": "#FAF8F3",
      "sidebarRing": "#B3CF44"
    }
  },
  "fontFamily": {
    "sans": [
      "DM Sans",
      "Helvetica Neue",
      "Helvetica",
      "Arial",
      "sans-serif"
    ],
    "serif": [
      "Barlow Condensed",
      "ui-sans-serif",
      "system-ui",
      "sans-serif"
    ],
    "mono": [
      "Space Grotesk",
      "ui-sans-serif",
      "system-ui",
      "sans-serif"
    ]
  },
  "radius": "0.5rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;

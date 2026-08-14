/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#FFFFFF",
      "foreground": "#2D2D3A",
      "border": "#E0DFF5",
      "card": "#FFF8F0",
      "cardForeground": "#2D2D3A",
      "popover": "#FFFFFF",
      "popoverForeground": "#2D2D3A",
      "primary": "#6B5CE7",
      "primaryForeground": "#FFFFFF",
      "secondary": "#FFF8F0",
      "secondaryForeground": "#2D2D3A",
      "muted": "#F5F5F7",
      "mutedForeground": "#888888",
      "accent": "#F4A261",
      "accentForeground": "#2D2D3A",
      "destructive": "#E07A5F",
      "destructiveForeground": "#FFFFFF",
      "input": "#E0DFF5",
      "ring": "#6B5CE7",
      "chart1": "#6B5CE7",
      "chart2": "#F4A261",
      "chart3": "#4CAF50",
      "chart4": "#5A4FAB",
      "chart5": "#E07A5F",
      "sidebar": "#FFFFFF",
      "sidebarForeground": "#2D2D3A",
      "sidebarBorder": "#E0DFF5",
      "sidebarPrimary": "#6B5CE7",
      "sidebarPrimaryForeground": "#FFFFFF",
      "sidebarAccent": "#FFF8F0",
      "sidebarAccentForeground": "#2D2D3A",
      "sidebarRing": "#6B5CE7"
    },
    "dark": {
      "background": "#1A1A2E",
      "foreground": "#E0E0E0",
      "border": "#2A2A45",
      "card": "#242440",
      "cardForeground": "#E0E0E0",
      "popover": "#242440",
      "popoverForeground": "#E0E0E0",
      "primary": "#F4A261",
      "primaryForeground": "#2D2D3A",
      "secondary": "#242440",
      "secondaryForeground": "#E0E0E0",
      "muted": "#242440",
      "mutedForeground": "#9A9AB0",
      "accent": "#6B5CE7",
      "accentForeground": "#FFFFFF",
      "destructive": "#E07A5F",
      "destructiveForeground": "#FFFFFF",
      "input": "#2A2A45",
      "ring": "#F4A261",
      "chart1": "#6B5CE7",
      "chart2": "#F4A261",
      "chart3": "#4CAF50",
      "chart4": "#5A4FAB",
      "chart5": "#E07A5F",
      "sidebar": "#1A1A2E",
      "sidebarForeground": "#E0E0E0",
      "sidebarBorder": "#2A2A45",
      "sidebarPrimary": "#F4A261",
      "sidebarPrimaryForeground": "#2D2D3A",
      "sidebarAccent": "#242440",
      "sidebarAccentForeground": "#E0E0E0",
      "sidebarRing": "#F4A261"
    }
  },
  "fontFamily": {
    "sans": [
      "Nunito",
      "Quicksand",
      "ui-sans-serif",
      "system-ui",
      "sans-serif"
    ],
    "serif": [
      "Georgia",
      "serif"
    ],
    "mono": [
      "JetBrains Mono",
      "ui-monospace",
      "SFMono-Regular",
      "Menlo",
      "monospace"
    ]
  },
  "radius": "0.75rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;

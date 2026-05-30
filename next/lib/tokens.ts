/**
 * Design tokens: single source of truth.
 * Consumed by tailwind.config.ts and (where needed) at runtime in TS.
 */
export const tokens = {
  color: {
    bgDeep:        "#020203",
    bgBase:        "#050506",
    bgElevated:    "#0a0a0c",
    bgElev2:       "#0f0f12",
    surface:       "rgba(255,255,255,0.05)",
    surfaceHover:  "rgba(255,255,255,0.08)",
    fg:            "#EDEDEF",
    fgSoft:        "#C7CBD6", // body / lead: readable but slightly softer than fg
    fgMuted:       "#8A8F98", // metadata, captions, eyebrows
    fgSubtle:      "rgba(255,255,255,0.60)",
    accent:        "#5E6AD2",
    accentBright:  "#6872D9",
    accentGlow:    "rgba(94,106,210,0.30)",
    accentSoft:    "rgba(94,106,210,0.12)",
    good:          "#5BD5A0",
    warn:          "#F4B942",
    bad:           "#F1657A",
    border:        "rgba(255,255,255,0.06)",
    borderHover:   "rgba(255,255,255,0.10)",
    borderAccent:  "rgba(94,106,210,0.30)",
  },
  shadow: {
    card:
      "0 0 0 1px rgba(255,255,255,0.06), 0 2px 20px rgba(0,0,0,0.40), 0 0 40px rgba(0,0,0,0.20)",
    cardHover:
      "0 0 0 1px rgba(255,255,255,0.10), 0 8px 40px rgba(0,0,0,0.50), 0 0 80px rgba(94,106,210,0.10)",
    accent:
      "0 0 0 1px rgba(94,106,210,0.50), 0 4px 12px rgba(94,106,210,0.30), inset 0 1px 0 0 rgba(255,255,255,0.20)",
    innerTop: "inset 0 1px 0 0 rgba(255,255,255,0.10)",
  },
  motion: {
    quick: "200ms",
    base: "300ms",
    slow: "600ms",
    expo: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export type Tokens = typeof tokens;

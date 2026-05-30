import type { Config } from "tailwindcss";
import { tokens } from "./lib/tokens";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-deep": tokens.color.bgDeep,
        "bg-base": tokens.color.bgBase,
        "bg-elevated": tokens.color.bgElevated,
        "bg-elev-2": tokens.color.bgElev2,
        surface: tokens.color.surface,
        "surface-hover": tokens.color.surfaceHover,
        fg: tokens.color.fg,
        "fg-soft": tokens.color.fgSoft,
        "fg-muted": tokens.color.fgMuted,
        "fg-subtle": tokens.color.fgSubtle,
        accent: tokens.color.accent,
        "accent-bright": tokens.color.accentBright,
        "accent-glow": tokens.color.accentGlow,
        "accent-soft": tokens.color.accentSoft,
        good: tokens.color.good,
        warn: tokens.color.warn,
        bad: tokens.color.bad,
        "border-default": tokens.color.border,
        "border-hover": tokens.color.borderHover,
        "border-accent": tokens.color.borderAccent,
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Pretendard",
          "Apple SD Gothic Neo",
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        quick: "200ms",
        base: "300ms",
        slow: "600ms",
      },
      boxShadow: {
        card: tokens.shadow.card,
        "card-hover": tokens.shadow.cardHover,
        accent: tokens.shadow.accent,
        "inner-top": tokens.shadow.innerTop,
      },
      keyframes: {
        floatA: {
          "0%,100%": { transform: "translateX(-50%) translateY(0) rotate(0deg)" },
          "50%": { transform: "translateX(-48%) translateY(-30px) rotate(1.5deg)" },
        },
        floatB: {
          "0%,100%": { transform: "translate(0,0) rotate(0)" },
          "50%": { transform: "translate(40px,-20px) rotate(-2deg)" },
        },
        floatC: {
          "0%,100%": { transform: "translate(0,0) rotate(0)" },
          "50%": { transform: "translate(-30px,30px) rotate(2deg)" },
        },
        pulse: {
          "0%,100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "200% 0%" },
        },
        dotPulse: {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.8)" },
        },
      },
      animation: {
        floatA: "floatA 12s cubic-bezier(0.16,1,0.3,1) infinite",
        floatB: "floatB 14s cubic-bezier(0.16,1,0.3,1) infinite",
        floatC: "floatC 16s cubic-bezier(0.16,1,0.3,1) infinite",
        pulse: "pulse 9s ease-in-out infinite",
        shimmer: "shimmer 5s linear infinite",
        dotPulse: "dotPulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

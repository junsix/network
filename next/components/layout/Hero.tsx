"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface HeroProps {
  eyebrow?: string;
  /** Main heading. For docs pages, keep this short (topic name only). */
  title: React.ReactNode;
  /** Optional tagline rendered under the title. Use <Accent> inside. */
  subtitle?: React.ReactNode;
  lead?: React.ReactNode;
  /** Disable scroll-linked parallax on docs pages where it'd be distracting. */
  parallax?: boolean;
  /** Learning level: 1 (기초) · 2 (실무) · 3 (시니어). */
  level?: 1 | 2 | 3;
}

const LEVEL_META = {
  1: { label: "L1 · 기초", color: "#5BD5A0", border: "rgba(91,213,160,0.3)", bg: "rgba(91,213,160,0.08)" },
  2: { label: "L2 · 실무", color: "#8B95E5", border: "rgba(94,106,210,0.35)", bg: "rgba(94,106,210,0.10)" },
  3: { label: "L3 · 시니어", color: "#F4B942", border: "rgba(244,185,66,0.35)", bg: "rgba(244,185,66,0.08)" },
} as const;

/**
 * Hero with optional scroll-linked parallax (opacity + scale + y).
 *
 * Two layouts:
 *  - `title` only            → standard hero size (used by home).
 *  - `title` + `subtitle`    → very large display title with a smaller
 *                              tagline below. Used by docs pages.
 */
export function Hero({ eyebrow, title, subtitle, lead, parallax = true, level }: HeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 500], [1, parallax && !reduce ? 0 : 1]);
  const scale = useTransform(scrollY, [0, 4000], [1, parallax && !reduce ? 0.97 : 1]);
  const y = useTransform(scrollY, [0, 500], [0, parallax && !reduce ? 80 : 0]);

  return (
    <motion.section
      ref={ref}
      style={{ opacity, scale, y }}
      className="pb-8 pt-12 lg:pt-16"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {level && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em]"
            style={{
              color: LEVEL_META[level].color,
              borderColor: LEVEL_META[level].border,
              background: LEVEL_META[level].bg,
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: LEVEL_META[level].color }}
            />
            {LEVEL_META[level].label}
          </span>
        )}
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-surface px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.15em] text-fg-muted shadow-inner-top">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--tw-shadow-color)] shadow-accent-glow animate-dotPulse" />
            {eyebrow}
          </span>
        )}
      </div>

      <h1
        className={cn(
          "font-semibold tracking-[-0.03em] bg-gradient-to-b from-white from-0% via-white/95 via-35% to-white/70 bg-clip-text text-transparent",
          subtitle
            ? "mb-3 text-[clamp(52px,8vw,96px)] leading-[1.02]"
            : "mb-5 text-[clamp(36px,5.4vw,68px)] leading-[1.05]"
        )}
        style={{ wordBreak: "keep-all", overflowWrap: "anywhere" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="mb-7 max-w-[52ch] text-[clamp(20px,2.6vw,30px)] font-normal leading-[1.32] tracking-tight text-fg-soft"
          style={{ wordBreak: "keep-all", overflowWrap: "anywhere" }}
        >
          {subtitle}
        </p>
      )}
      {lead && (
        <p
          className="max-w-[64ch] text-[clamp(16px,1.3vw,19px)] leading-[1.7] text-fg-soft"
          style={{ wordBreak: "keep-all", overflowWrap: "anywhere" }}
        >
          {lead}
        </p>
      )}
    </motion.section>
  );
}

/** Animated indigo gradient span used inside Hero titles. */
export function Accent({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="bg-clip-text text-transparent animate-shimmer"
      style={{
        backgroundImage:
          "linear-gradient(90deg, #5E6AD2 0%, #8B95E5 50%, #5E6AD2 100%)",
        backgroundSize: "200% 100%",
      }}
    >
      {children}
    </span>
  );
}

"use client";

import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Wraps the card in a <Link>. */
  href?: string;
  /** Mouse-tracking radial spotlight on hover. Default true. */
  spotlight?: boolean;
  /** Larger padding + extra accent for hero cards. */
  emphasis?: boolean;
  children: React.ReactNode;
}

/**
 * Glass card with:
 *  - multi-layer shadow stack (border + diffuse + ambient)
 *  - top-edge gradient highlight
 *  - optional mouse-tracking spotlight (radial gradient under contents)
 *  - href option to skip the <Link> wrapper boilerplate
 */
export function Card({
  href,
  spotlight = true,
  emphasis,
  className,
  children,
  ...rest
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!spotlight || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  const inner = (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative isolate flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.06] shadow-card",
        "transition-[transform,border-color,box-shadow] duration-base ease-expo",
        "hover:-translate-y-0.5 hover:border-white/10 hover:shadow-card-hover",
        emphasis ? "p-7" : "p-5",
        className
      )}
      style={{
        background: emphasis
          ? "radial-gradient(ellipse at 100% 0%, rgba(94,106,210,0.12), transparent 50%), linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      }}
      {...rest}
    >
      {/* Top edge highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[12%] right-[12%] top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
        }}
      />
      {/* Spotlight */}
      {spotlight && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-base ease-expo group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(280px circle at var(--mx,50%) var(--my,50%), rgba(94,106,210,0.18), transparent 45%)",
          }}
        />
      )}
      <div className="relative z-[1] flex flex-1 flex-col">{children}</div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus:outline-none">
        {inner}
      </Link>
    );
  }
  return inner;
}

/** Tiny ordinal label printed at the top of cards ("01 · Foundation"). */
export function CardOrd({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-3 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-fg-muted">
      {children}
    </span>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "mb-2 text-[17px] font-semibold leading-tight tracking-tight text-fg",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[14px] leading-[1.65] text-fg-soft [&_strong]:text-fg [&_strong]:font-semibold",
        className
      )}
      style={{ wordBreak: "keep-all", overflowWrap: "anywhere" }}
    >
      {children}
    </p>
  );
}

interface TagProps {
  tone?: "default" | "good" | "warn" | "bad" | "accent";
  children: React.ReactNode;
}
export function Tag({ tone = "default", children }: TagProps) {
  const toneClasses: Record<NonNullable<TagProps["tone"]>, string> = {
    default: "bg-surface text-fg-muted border-white/[0.06]",
    good: "bg-good/[0.06] text-good border-good/30",
    warn: "bg-warn/[0.06] text-warn border-warn/30",
    bad: "bg-bad/[0.06] text-bad border-bad/30",
    accent: "bg-accent-soft text-[#B7BFF0] border-accent/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10.5px] tracking-[0.05em]",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Tags({ children }: { children: React.ReactNode }) {
  // mt-auto pushes tags to the bottom of a flex-col card, keeping cards
  // visually consistent when they stretch to fill a tall grid cell.
  return <div className="mt-auto flex flex-wrap gap-1.5 pt-3">{children}</div>;
}

import { cn } from "@/lib/utils";

type Tone = "warn" | "bad" | "good";

interface CalloutProps {
  tone?: Tone;
  children: React.ReactNode;
}

const tones: Record<
  Tone,
  { bg: string; border: string; bar: string; glow: string }
> = {
  warn: {
    bg: "from-warn/[0.06] to-warn/[0.02]",
    border: "border-warn/20",
    bar: "bg-warn",
    glow: "shadow-[0_0_12px_rgba(244,185,66,0.6)]",
  },
  bad: {
    bg: "from-bad/[0.06] to-bad/[0.02]",
    border: "border-bad/20",
    bar: "bg-bad",
    glow: "shadow-[0_0_12px_rgba(241,101,122,0.6)]",
  },
  good: {
    bg: "from-good/[0.05] to-good/[0.02]",
    border: "border-good/20",
    bar: "bg-good",
    glow: "shadow-[0_0_12px_rgba(91,213,160,0.6)]",
  },
};

export function Callout({ tone = "warn", children }: CalloutProps) {
  const t = tones[tone];
  return (
    <div
      className={cn(
        "relative my-4 rounded-lg border bg-gradient-to-b px-4 py-3.5 pl-5 text-[14px] leading-relaxed shadow-inner-top",
        t.bg,
        t.border
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute bottom-3.5 left-0 top-3.5 w-0.5 rounded-sm",
          t.bar,
          t.glow
        )}
      />
      <div className="text-fg [&_strong]:font-semibold [&_strong]:text-fg">
        {children}
      </div>
    </div>
  );
}

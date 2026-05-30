import { cn } from "@/lib/utils";

/**
 * Inline metric chips. Use inside <MetricRow>.
 *   <MetricRow>
 *     <Metric value="~75K" label="활성 AS 수" />
 *     <Metric value="BBR" label="기본 CC" accent />
 *   </MetricRow>
 */
export function MetricRow({ children }: { children: React.ReactNode }) {
  return <div className="my-3.5 flex flex-wrap gap-2.5">{children}</div>;
}

export function Metric({
  value,
  label,
  accent,
}: {
  value: React.ReactNode;
  label: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="inline-flex items-baseline gap-2 rounded-md border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] px-3.5 py-2.5 shadow-inner-top">
      <span
        className={cn(
          "font-mono text-[18px] font-semibold tracking-tight",
          accent ? "text-[#B7BFF0]" : "text-fg"
        )}
      >
        {value}
      </span>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-fg-muted">
        {label}
      </span>
    </div>
  );
}

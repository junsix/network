import { cn } from "@/lib/utils";

/**
 * Side-by-side pros/cons (or strengths/weaknesses) panel.
 *   <PCBox>
 *     <PC tone="good" title="적합한 곳"><ul>...</ul></PC>
 *     <PC tone="bad"  title="약점"><ul>...</ul></PC>
 *   </PCBox>
 */
export function PCBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 grid gap-3 sm:grid-cols-2">{children}</div>
  );
}

type PCTone = "good" | "bad";

const bars: Record<PCTone, string> = {
  good: "bg-good shadow-[0_0_10px_rgba(91,213,160,0.45)]",
  bad: "bg-bad shadow-[0_0_10px_rgba(241,101,122,0.45)]",
};

export function PC({
  tone,
  title,
  children,
}: {
  tone: PCTone;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-lg border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] px-4 py-4 pl-5"
    >
      <span
        aria-hidden
        className={cn(
          "absolute bottom-3.5 left-0 top-3.5 w-0.5 rounded-sm",
          bars[tone]
        )}
      />
      <h4 className="mb-1.5 text-[13px] font-semibold tracking-tight text-fg">
        {title}
      </h4>
      <div className="text-[13.5px] leading-relaxed text-fg [&>ul]:m-0 [&>ul]:list-disc [&>ul]:pl-[18px] [&_li]:my-1">
        {children}
      </div>
    </div>
  );
}

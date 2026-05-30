/**
 * Wrapped <table> with the Linear styling baked in.
 * Use exactly like a normal table: semantics intact for a11y.
 *   <DataTable>
 *     <thead><tr><th>...</th></tr></thead>
 *     <tbody><tr><td>...</td></tr></tbody>
 *   </DataTable>
 */
import { cn } from "@/lib/utils";

export function DataTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="my-3 overflow-x-auto">
      <table
        className={cn(
          "w-full border-separate border-spacing-0 overflow-hidden rounded-lg border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] text-[13.5px] shadow-inner-top",
          "[&_th]:bg-white/[0.02] [&_th]:border-b [&_th]:border-white/[0.06] [&_th]:px-3.5 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-mono [&_th]:text-[11.5px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-fg-muted",
          "[&_td]:px-3.5 [&_td]:py-2.5 [&_td]:align-top [&_td]:text-fg",
          "[&_tbody_tr+tr_td]:border-t [&_tbody_tr+tr_td]:border-white/[0.06]",
          "[&_tbody_tr:hover_td]:bg-accent/[0.04]",
          className
        )}
      >
        {children}
      </table>
    </div>
  );
}

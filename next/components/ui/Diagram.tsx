import { cn } from "@/lib/utils";

/**
 * Wrapper for inline SVG diagrams. Provides the consistent dark panel
 * background, accent radial glow, and rounded card frame.
 */
export function Diagram({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "my-4 rounded-xl border border-white/[0.06] p-4 shadow-card [&_svg]:block [&_svg]:h-auto [&_svg]:w-full",
        className
      )}
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(94,106,210,0.08), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
      }}
    >
      {children}
    </div>
  );
}

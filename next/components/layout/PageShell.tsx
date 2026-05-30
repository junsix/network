import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  /** Wide shell for the homepage, narrow for docs reading width. */
  wide?: boolean;
  className?: string;
}

export function PageShell({ children, wide, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto px-6 py-10 lg:px-10 lg:py-14",
        wide ? "max-w-[1280px]" : "max-w-[820px]",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Numbered step list. Each <li> gets an auto-incrementing indigo badge.
 *   <Steps>
 *     <li>...</li>
 *     <li>...</li>
 *   </Steps>
 */
export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol
      className="my-3 list-none p-0 [counter-reset:s] [&>li]:relative [&>li]:my-2.5 [&>li]:rounded-md [&>li]:border [&>li]:border-white/[0.06] [&>li]:bg-gradient-to-b [&>li]:from-white/[0.03] [&>li]:to-white/[0.01] [&>li]:py-3 [&>li]:pl-[50px] [&>li]:pr-3.5 [&>li]:text-[14px] [&>li]:leading-relaxed [&>li]:text-fg [&>li]:[counter-increment:s] [&>li]:before:absolute [&>li]:before:left-[14px] [&>li]:before:top-3 [&>li]:before:flex [&>li]:before:h-6 [&>li]:before:w-6 [&>li]:before:items-center [&>li]:before:justify-center [&>li]:before:rounded-full [&>li]:before:border [&>li]:before:border-accent/30 [&>li]:before:bg-accent-soft [&>li]:before:font-mono [&>li]:before:text-[11px] [&>li]:before:font-semibold [&>li]:before:text-[#B7BFF0] [&>li]:before:content-[counter(s)]"
    >
      {children}
    </ol>
  );
}

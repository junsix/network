/**
 * Small monospace caps label used above section headings.
 *   <Eyebrow>OSI 모델</Eyebrow>
 */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-fg-muted">
      {children}
    </span>
  );
}

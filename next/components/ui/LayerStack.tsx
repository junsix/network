/**
 * OSI / TCP-IP layer stack visual.
 *   <LayerStack
 *     layers={[
 *       { num: "L7", title: "Application", desc: "...", proto: "HTTP, DNS, SSH" },
 *       ...
 *     ]}
 *   />
 */
export interface Layer {
  num: string;
  title: string;
  desc: string;
  problem?: string;
  proto: string;
}

export function LayerStack({ layers }: { layers: Layer[] }) {
  return (
    <div className="my-4 grid gap-2">
      {layers.map((l) => (
        <div
          key={l.num}
          className="grid grid-cols-[56px_1fr] gap-2.5 rounded-lg border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] px-4 py-3.5 shadow-inner-top transition-[transform,border-color] duration-quick ease-expo hover:translate-x-0.5 hover:border-accent/30 sm:grid-cols-[64px_1fr_1fr_1fr] sm:gap-3.5"
        >
          <div className="self-center font-mono text-[13px] font-semibold tracking-wider text-accent-bright">
            {l.num}
          </div>
          <div>
            <div className="text-[14.5px] font-semibold tracking-tight text-fg">
              {l.title}
            </div>
            <div className="mt-0.5 text-[13px] leading-snug text-fg-muted">
              {l.desc}
            </div>
          </div>
          <div className="text-[13px] leading-snug text-fg-muted sm:col-auto col-span-2">
            {l.problem}
          </div>
          <div className="font-mono text-[12px] leading-snug text-[#D8DEF5] sm:col-auto col-span-2">
            {l.proto}
          </div>
        </div>
      ))}
    </div>
  );
}

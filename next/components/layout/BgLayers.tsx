/**
 * Ambient background:
 *   1) base radial gradient (page canvas)
 *   2) floating accent blobs (4 layers, animated)
 *   3) noise SVG for tactility
 *   4) faint grid overlay
 *
 * Fixed full-viewport, behind everything, pointer-events: none.
 */
export function BgLayers() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Layer 1: base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, #0a0a0f 0%, #050506 50%, #020203 100%)",
        }}
      />
      {/* Layer 3: blobs */}
      <div
        className="absolute left-1/2 -top-48 h-[900px] w-[1100px] -translate-x-1/2 rounded-full opacity-40 animate-floatA"
        style={{
          filter: "blur(150px)",
          background:
            "radial-gradient(circle, rgba(94,106,210,0.55), transparent 65%)",
        }}
      />
      <div
        className="absolute top-[20%] -left-48 h-[800px] w-[700px] rounded-full opacity-[0.35] animate-floatB"
        style={{
          filter: "blur(140px)",
          background:
            "radial-gradient(circle, rgba(140,90,210,0.32), transparent 65%)",
        }}
      />
      <div
        className="absolute top-[40%] -right-48 h-[700px] w-[600px] rounded-full opacity-30 animate-floatC"
        style={{
          filter: "blur(120px)",
          background:
            "radial-gradient(circle, rgba(90,140,210,0.28), transparent 65%)",
        }}
      />
      <div
        className="absolute -bottom-24 left-[30%] h-[500px] w-[800px] rounded-full opacity-50 animate-pulse"
        style={{
          filter: "blur(130px)",
          background:
            "radial-gradient(circle, rgba(94,106,210,0.20), transparent 65%)",
        }}
      />
      {/* Layer 2: noise */}
      <div
        className="absolute inset-0 opacity-[0.018] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "200px 200px",
        }}
      />
      {/* Layer 4: grid */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
    </div>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type PacketKind = "syn" | "ack" | "fin" | "data" | "dns";

export interface FlyOpts {
  label: string;
  cls?: PacketKind;
  duration?: number;
  from?: "left" | "right";
}

/** Step in a declarative sequence: fully serializable across RSC boundary. */
export type Step =
  | { say: string }
  | { fly: FlyOpts };

export interface LaneNode {
  label: string;
  /** Optional second line under the node label (IP, MAC, etc.). */
  meta?: ReactNode;
}

interface LaneProps {
  nodes: LaneNode[];
  /** Declarative sequence. Each step is either a log line or a packet flight. */
  steps: Step[];
  /** Override button label. */
  runLabel?: string;
}

const pktClasses: Record<PacketKind, string> = {
  syn: "bg-gradient-to-b from-[#2a3170] to-[#1d245e] shadow-[0_6px_18px_rgba(0,0,0,0.4),0_0_22px_rgba(94,106,210,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)]",
  ack: "bg-gradient-to-b from-[#1e4a3a] to-[#143a2e] shadow-[0_6px_18px_rgba(0,0,0,0.4),0_0_22px_rgba(91,213,160,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)]",
  fin: "bg-gradient-to-b from-[#4a2030] to-[#3a1827] shadow-[0_6px_18px_rgba(0,0,0,0.4),0_0_22px_rgba(241,101,122,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)]",
  data: "bg-gradient-to-b from-[#2e2e63] to-[#1d1d4a] shadow-[0_6px_18px_rgba(0,0,0,0.4),0_0_22px_rgba(120,120,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)]",
  dns: "bg-gradient-to-b from-[#4a3514] to-[#382808] shadow-[0_6px_18px_rgba(0,0,0,0.4),0_0_22px_rgba(244,185,66,0.28),inset_0_1px_0_0_rgba(255,255,255,0.15)]",
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Packet-flow visualization. Takes a declarative array of steps so the
 * component can be safely used inside server-rendered MDX.
 *
 *   <Lane
 *     nodes={[{ label: "A", meta: "..." }, ...]}
 *     steps={[
 *       { say: "A: ..." },
 *       { fly: { label: "ARP Req", cls: "syn", duration: 1400 } },
 *     ]}
 *   />
 */
export function Lane({ nodes, steps, runLabel = "▶ 시작" }: LaneProps) {
  const laneRef = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);

  const fly = useCallback(
    ({ label, cls = "data", duration = 1200, from = "left" }: FlyOpts) =>
      new Promise<void>((resolve) => {
        const lane = laneRef.current;
        if (!lane) return resolve();
        const pkt = document.createElement("div");
        pkt.textContent = label;
        pkt.dataset.pkt = "1";
        pkt.className = [
          "absolute top-1/2 z-[3] -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 px-2.5 py-1 font-mono text-[10.8px] tracking-wide text-white",
          pktClasses[cls],
        ].join(" ");
        if (from === "left") {
          pkt.style.left = "16px";
          pkt.style.transform = "translate(0,-50%)";
        } else {
          pkt.style.right = "16px";
          pkt.style.transform = "translate(0,-50%)";
        }
        lane.appendChild(pkt);

        const laneWidth = lane.clientWidth;
        const pktWidth = pkt.offsetWidth;
        const offset = Math.max(40, laneWidth - pktWidth - 32);
        const dur = prefersReducedMotion() ? 0 : duration;

        requestAnimationFrame(() => {
          pkt.style.transition = `transform ${dur}ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease-out`;
          const dx = from === "left" ? offset : -offset;
          pkt.style.transform = `translate(${dx}px, -50%)`;
        });

        window.setTimeout(() => {
          pkt.style.opacity = "0";
          window.setTimeout(() => pkt.remove(), 280);
          resolve();
        }, dur);
      }),
    []
  );

  const reset = useCallback(() => {
    cancelRef.current = true;
    setLog([]);
    laneRef.current?.querySelectorAll("[data-pkt]").forEach((p) => p.remove());
  }, []);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    cancelRef.current = false;
    setLog([]);
    for (const step of steps) {
      if (cancelRef.current) break;
      if ("say" in step) {
        setLog((prev) => [...prev, step.say]);
      } else if ("fly" in step) {
        await fly(step.fly);
      }
    }
    setRunning(false);
  }, [running, steps, fly]);

  // Cancel on unmount
  useEffect(() => () => { cancelRef.current = true; }, []);

  return (
    <div
      className="my-4 rounded-xl border border-white/[0.06] p-4 shadow-card"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(94,106,210,0.08), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
      }}
    >
      {nodes.some((n) => n.meta) && (
        <div
          className="mb-2.5 grid gap-2 text-center font-mono text-[11.5px] text-fg-muted"
          style={{ gridTemplateColumns: `repeat(${nodes.length}, 1fr)` }}
        >
          {nodes.map((n, i) => (
            <div key={i}>
              <div className="font-semibold text-fg">{n.label}</div>
              {n.meta && <div className="mt-0.5 leading-snug">{n.meta}</div>}
            </div>
          ))}
        </div>
      )}

      <div
        ref={laneRef}
        className="relative h-24 overflow-hidden rounded-lg border border-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),inset_0_0_60px_rgba(0,0,0,0.4)]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(94,106,210,0.06), transparent 70%), linear-gradient(180deg, #0b0c14 0%, #07080e 100%)",
        }}
      >
        <div
          aria-hidden
          className="absolute left-3.5 right-3.5 top-1/2 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 15%, rgba(255,255,255,0.08) 85%, transparent)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3.5">
          {nodes.map((n, i) => (
            <div
              key={i}
              className="relative z-[2] rounded-md border border-white/[0.06] bg-gradient-to-b from-white/[0.08] to-white/[0.02] px-2.5 py-1.5 text-[12px] font-medium text-fg shadow-inner-top"
            >
              {n.label}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className={cn(
            "relative overflow-hidden rounded-md px-3.5 py-2 text-[13px] font-medium tracking-tight transition-[filter,box-shadow,transform] duration-quick ease-expo",
            "bg-gradient-to-b from-accent-bright to-accent text-white shadow-accent active:scale-[0.98]",
            running ? "cursor-not-allowed opacity-50" : "hover:brightness-105"
          )}
        >
          {running ? "흐르는 중…" : runLabel}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-white/[0.06] bg-surface px-3.5 py-2 text-[13px] font-medium text-fg shadow-inner-top transition-colors duration-quick ease-expo hover:border-white/10 hover:bg-surface-hover active:scale-[0.98]"
        >
          ↺ 초기화
        </button>
      </div>

      <div className="mt-2.5 min-h-[60px] font-mono text-[13px] leading-relaxed text-fg-muted">
        {log.map((l, i) => (
          <div key={i}>› {l}</div>
        ))}
      </div>
    </div>
  );
}

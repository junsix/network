"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { topicGroups, type Topic, type TopicGroup } from "@/lib/topics";
import { cn } from "@/lib/utils";

interface SidebarProps {
  /** Mobile drawer open state. Desktop ignores this. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses search anywhere in the app
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setQ("");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo<TopicGroup[]>(() => {
    if (!q.trim()) return topicGroups;
    const needle = q.toLowerCase();
    return topicGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (t) =>
            t.title.toLowerCase().includes(needle) ||
            (t.subtitle?.toLowerCase().includes(needle) ?? false) ||
            t.slug.toLowerCase().includes(needle)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [q]);

  const activeSlug = useMemo(() => {
    // /docs/advanced/bgp → "advanced/bgp"
    const m = pathname?.match(/^\/docs\/(.+)$/);
    return m ? m[1].replace(/\/$/, "") : "";
  }, [pathname]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-svh w-[280px] flex-col border-r border-white/[0.06] bg-bg-base/85 backdrop-blur-xl transition-transform duration-base ease-expo lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold tracking-tight text-fg"
            onClick={onClose}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--tw-shadow-color)] shadow-accent-glow" />
            net·viz
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-md p-1.5 text-fg-muted hover:bg-surface lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mx-4 mb-3">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
          />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="개념 검색…"
            aria-label="Search topics"
            className="w-full rounded-md border border-white/[0.06] bg-bg-elevated py-2 pl-9 pr-9 text-sm text-fg placeholder:text-fg-muted/70 outline-none transition-colors hover:border-white/10 focus:border-accent/40 focus:bg-bg-elev-2"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 bg-bg-elev-2 px-1.5 py-0.5 font-mono text-[10px] text-fg-muted sm:block">
            /
          </kbd>
        </div>

        {/* Topic groups */}
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-6">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 font-mono text-xs text-fg-muted">
              "{q}"에 맞는 토픽이 없습니다.
            </p>
          ) : (
            filtered.map((g) => (
              <TopicGroupBlock
                key={g.id}
                group={g}
                activeSlug={activeSlug}
                onItemClick={onClose}
              />
            ))
          )}
        </nav>

        {/* Foot */}
        <div className="border-t border-white/[0.06] px-5 py-3 font-mono text-[10.5px] uppercase tracking-widest text-fg-muted/80">
          <span className="text-fg">15 topics</span> · 4 groups
        </div>
      </aside>
    </>
  );
}

// Color per level — same hue family but distinct depth.
const levelStyles: Record<number, { dot: string; label: string }> = {
  1: { dot: "bg-[#5BD5A0]", label: "text-[#5BD5A0]" },     // 기초 — 초록
  2: { dot: "bg-[#5E6AD2]", label: "text-[#8B95E5]" },     // 실무 — 인디고
  3: { dot: "bg-[#F4B942]", label: "text-[#F4B942]" },     // 시니어 — 호박
};

function TopicGroupBlock({
  group,
  activeSlug,
  onItemClick,
}: {
  group: TopicGroup;
  activeSlug: string;
  onItemClick: () => void;
}) {
  const ls = levelStyles[group.level];
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 px-3 pb-1 pt-2">
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full", ls.dot)} />
        <span className={cn("font-mono text-[10.5px] uppercase tracking-widest", ls.label)}>
          {group.label}
        </span>
      </div>
      {group.hint && (
        <div className="px-3 pb-2 text-[10.5px] leading-snug text-fg-muted/60">
          {group.hint}
        </div>
      )}
      <ul>
        {group.items.map((t) => (
          <li key={t.slug}>
            <SidebarLink topic={t} active={t.slug === activeSlug} onClick={onItemClick} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarLink({
  topic,
  active,
  onClick,
}: {
  topic: Topic;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={`/docs/${topic.slug}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative block rounded-md px-3 py-2 transition-colors duration-quick ease-expo",
        active
          ? "bg-accent-soft text-fg"
          : "text-fg-muted hover:bg-surface hover:text-fg"
      )}
    >
      {/* Active indicator bar */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full transition-opacity duration-quick",
          active ? "bg-accent opacity-100" : "opacity-0"
        )}
      />
      <div className="text-[13.5px] font-medium leading-tight tracking-tight">
        {topic.title}
      </div>
      {topic.subtitle && (
        <div
          className={cn(
            "mt-0.5 truncate text-[11.5px]",
            active ? "text-fg-muted" : "text-fg-muted/70 group-hover:text-fg-muted"
          )}
        >
          {topic.subtitle}
        </div>
      )}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

interface TopNavProps {
  onMenuClick: () => void;
}

/**
 * Minimal top bar: present only because mobile needs a hamburger.
 * On desktop the sidebar carries the brand; this stays nearly empty.
 */
export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.06] bg-bg-base/65 px-4 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-md p-2 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
      >
        <Menu size={18} />
      </button>
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-bold tracking-tight text-fg"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_rgba(94,106,210,0.6)]" />
        net·viz
      </Link>
      <div className="w-9" /* spacer */ />
    </header>
  );
}

"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

/**
 * Wraps every page: sidebar (sticky on desktop, drawer on mobile)
 * + content area. Background layers live at root layout.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative z-10 min-h-svh">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <TopNav onMenuClick={() => setOpen(true)} />
      <main className="lg:pl-[280px]">{children}</main>
    </div>
  );
}

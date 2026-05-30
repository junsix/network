"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SubnavItem {
  slug: string;
  label: string;
}

/**
 * Sub-navigation chip row used on advanced (or any grouped) pages.
 * Active item is auto-detected from the current pathname.
 */
export function Subnav({
  items,
  basePath = "/docs/",
}: {
  items: SubnavItem[];
  basePath?: string;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Section navigation"
      className="relative z-[2] mb-3 mt-1 flex flex-wrap gap-1.5 rounded-lg border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-2 shadow-inner-top"
    >
      {items.map((it) => {
        const href = `${basePath}${it.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={it.slug}
            href={href}
            className={cn(
              "rounded-md px-2.5 py-1.5 font-mono text-[11.5px] tracking-wide transition-colors duration-quick ease-expo",
              active
                ? "border border-accent/30 bg-accent-soft text-[#BFC6F0]"
                : "border border-transparent text-fg-muted hover:bg-surface hover:text-fg"
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Pre-built advanced topic navigation. */
export const advancedSubnavItems: SubnavItem[] = [
  { slug: "advanced/bgp", label: "BGP · 인터넷 라우팅" },
  { slug: "advanced/cdn-lb", label: "CDN · Anycast · LB" },
  { slug: "advanced/quic", label: "QUIC · 혼잡 제어" },
  { slug: "advanced/vpn", label: "VPN · IPsec · WireGuard" },
  { slug: "advanced/auth", label: "OAuth · OIDC · mTLS" },
  { slug: "advanced/observability", label: "관측 · eBPF · Mesh" },
];

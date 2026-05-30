import type { Metadata } from "next";
import { BgLayers } from "@/components/layout/BgLayers";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "net·viz: 네트워크 & 보안 시각화",
  description:
    "네트워크의 계층, 프로토콜, 보안을 인터랙티브하게 따라가는 시각화 가이드.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-bg-base font-sans text-fg antialiased">
        <BgLayers />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

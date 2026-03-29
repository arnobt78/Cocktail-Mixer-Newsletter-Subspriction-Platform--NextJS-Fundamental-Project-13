"use client";

/**
 * Global chrome: public pages get Navbar + Footer; /admin/* uses its own layout/sidebar, so we hide them here.
 */
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdmin ? <Navbar /> : null}
      <main className="relative z-0 flex-1">{children}</main>
      {!isAdmin ? <Footer /> : null}
    </div>
  );
}

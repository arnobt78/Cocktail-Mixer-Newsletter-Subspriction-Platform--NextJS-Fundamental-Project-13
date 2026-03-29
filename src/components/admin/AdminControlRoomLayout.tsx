"use client";

/** Authenticated admin chrome: collapsible sidebar, mobile drawer, export + logout actions. */
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, LogOut, Menu, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BrandMark } from "@/components/layout/brand-mark";
import { AdminShellProvider, useAdminShell } from "@/context/admin-shell-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

function AdminControlRoomMain({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useAdminShell();
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isMd = useMediaQuery("(min-width: 768px)");
  const narrowSidebar = !isLg || Boolean(sidebarCollapsed && isLg);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showMobileMenu = mobileMenuOpen && !isMd;

  useEffect(() => {
    if (!showMobileMenu) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showMobileMenu]);

  useEffect(() => {
    if (!showMobileMenu) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showMobileMenu]);

  return (
    <div
      className={cn(
        "transition-[padding] duration-200 ease-out",
        narrowSidebar ? "pl-16" : "pl-64",
      )}
    >
      <div
        className="h-14 w-full shrink-0 md:hidden"
        aria-hidden
      />
      <div
        className={cn(
          "border-b border-white/10 bg-slate-950/80 backdrop-blur-md",
          "fixed left-16 right-0 top-0 z-[200] md:sticky md:left-auto md:top-auto md:z-50",
        )}
      >
        <div className="relative z-50 mx-auto flex w-full max-w-9xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <BrandMark className="min-w-0 shrink" />
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-100 transition hover:bg-white/10 md:hidden"
            aria-expanded={showMobileMenu}
            aria-controls="admin-topbar-mobile-menu"
            aria-label={showMobileMenu ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            {showMobileMenu ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
          <div className="hidden shrink-0 flex-wrap items-center justify-end gap-2 md:flex">
            <Link
              href="/api/admin/control-room/export"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-500/25 sm:text-sm"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Link>
            <form action="/api/admin/session/logout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10 sm:text-sm"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed bottom-0 left-16 right-0 top-0 z-30 transition-[opacity,backdrop-filter] duration-300 md:hidden",
          showMobileMenu
            ? "pointer-events-auto bg-slate-950/75 opacity-100 backdrop-blur-md"
            : "pointer-events-none bg-transparent opacity-0 backdrop-blur-none",
        )}
        aria-hidden={!showMobileMenu}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        id="admin-topbar-mobile-menu"
        className={cn(
          "fixed bottom-0 right-0 top-0 z-40 flex w-[min(18rem,calc(100vw-4rem))] flex-col border-l border-white/15 bg-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,0.06),-12px_0_48px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out md:hidden",
          "overflow-y-auto overscroll-y-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          showMobileMenu
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Admin actions"
      >
        <div className="flex flex-1 flex-col p-4 pt-16">
          <div className="mb-3 border-b border-white/10 pb-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Actions
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-900/90 p-2">
            <Link
              href="/api/admin/control-room/export"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-3 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Download className="h-4 w-4 shrink-0" />
              Export CSV
            </Link>
            <form action="/api/admin/session/logout" method="post">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-3 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="pb-10">{children}</div>
    </div>
  );
}

export function AdminControlRoomLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShellProvider>
      <TooltipProvider delayDuration={200}>
        <div className="relative min-h-screen">
          <AdminSidebar />
          <AdminControlRoomMain>{children}</AdminControlRoomMain>
        </div>
      </TooltipProvider>
    </AdminShellProvider>
  );
}

"use client";

/**
 * Public site navigation + mobile drawer. Favorite count subscribes to localStorage via useSyncExternalStore (SSR-safe).
 */
import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getFavoriteIds, subscribeFavorites } from "@/lib/favorites-storage";
import { useMediaQuery } from "@/hooks/use-media-query";

const links = [
  { href: "/", label: "Home" },
  { href: "/favorites", label: "My Favorites" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/about", label: "About" },
  { href: "/admin/control-room", label: "Admin Panel" },
];

export function Navbar() {
  const pathname = usePathname();
  const isMd = useMediaQuery("(min-width: 768px)");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showMobileMenu = mobileMenuOpen && !isMd;
  const favoriteCount = useSyncExternalStore(
    subscribeFavorites,
    () => getFavoriteIds().length,
    () => 0,
  );

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
    <>
      {/* Reserve space when the bar is fixed on small screens (out of document flow). */}
      <div
        className="h-[4.75rem] w-full shrink-0 md:hidden"
        aria-hidden
      />
      <header className="fixed inset-x-0 top-0 z-[200] border-b border-white/10 bg-black/35 backdrop-blur-sm md:sticky md:z-50">
        <nav className="relative z-50 mx-auto flex w-full max-w-9xl items-center justify-between px-4 py-4 sm:px-8">
        <BrandMark />

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-100 transition hover:bg-white/10 md:hidden"
          aria-expanded={showMobileMenu}
          aria-controls="site-navbar-mobile-menu"
          aria-label={showMobileMenu ? "Close menu" : "Open menu"}
          onClick={() => setMobileMenuOpen((o) => !o)}
        >
          {showMobileMenu ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>

        <ul className="hidden items-center gap-3 md:flex sm:gap-6">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
                  pathname === link.href
                    ? "bg-emerald-400/20 text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.4)]"
                    : "text-slate-300 hover:bg-white/10 hover:text-emerald-200",
                )}
              >
                {pathname === link.href ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : null}
                <span className="relative inline-flex">
                  {link.label}
                  {link.href === "/favorites" && favoriteCount > 0 ? (
                    <span className="absolute -right-4 -top-2 inline-flex min-w-5 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/50 px-0.5 text-xs font-semibold text-white">
                      {favoriteCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>

      {/*
        Overlay + drawer must NOT live inside <header>: backdrop-filter / blur on the
        header creates a containing block for position:fixed, so inset-0 was only
        ~nav height and the sheet was effectively invisible on phones.
      */}
      <div
        className={cn(
          "fixed inset-0 z-[190] transition-[opacity,backdrop-filter] duration-300 md:hidden",
          showMobileMenu
            ? "pointer-events-auto bg-slate-950/75 opacity-100 backdrop-blur-md"
            : "pointer-events-none bg-transparent opacity-0 backdrop-blur-none",
        )}
        aria-hidden={!showMobileMenu}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        id="site-navbar-mobile-menu"
        className={cn(
          "fixed inset-y-0 right-0 z-[195] flex w-[min(20rem,calc(100vw-1rem))] flex-col border-l border-white/15 bg-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,0.06),-12px_0_48px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out md:hidden",
          "overflow-y-auto overscroll-y-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          showMobileMenu
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="flex flex-1 flex-col gap-1 p-4 pt-[4.75rem]">
          <div className="mb-3 border-b border-white/10 pb-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Navigate
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition",
                  pathname === link.href
                    ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/30"
                    : "text-slate-200 hover:bg-white/10 hover:text-emerald-200",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {pathname === link.href ? (
                  <Sparkles className="h-4 w-4 shrink-0" />
                ) : null}
                <span className="relative inline-flex">
                  {link.label}
                  {link.href === "/favorites" && favoriteCount > 0 ? (
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/50 px-1.5 text-xs font-semibold text-white">
                      {favoriteCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

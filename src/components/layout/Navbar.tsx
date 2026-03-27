"use client";

import Link from "next/link";
import { Heart, Martini, ShieldCheck, Sparkles } from "lucide-react";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getFavoriteIds, subscribeFavorites } from "@/lib/favorites-storage";

const links = [
  { href: "/", label: "Home" },
  { href: "/favorites", label: "Favorites" },
  { href: "/about", label: "About" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/admin/control-room", label: "Admin" },
];

export function Navbar() {
  const pathname = usePathname();
  const favoriteCount = useSyncExternalStore(
    subscribeFavorites,
    () => getFavoriteIds().length,
    () => 0,
  );

  return (
    <header className="sticky top-0 z-50 bg-black/35 backdrop-blur-sm">
      <nav className="mx-auto flex w-full max-w-9xl items-center justify-between px-4 py-4 sm:px-8 border-b border-white/10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-2xl font-semibold tracking-tight font-heading"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400/20 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.45)] transition group-hover:scale-105">
            <Martini className="h-5 w-5" />
          </span>
          <span className="bg-gradient-to-r from-emerald-200 via-emerald-300 to-cyan-200 bg-clip-text text-transparent">
            MixMaster
          </span>
        </Link>

        <ul className="flex items-center gap-3 sm:gap-6">
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
                {link.href === "/favorites" ? (
                  <Heart className="h-3.5 w-3.5" />
                ) : null}
                {link.href === "/admin/control-room" ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : null}
                <span className="relative inline-flex">
                  {link.label}
                  {link.href === "/favorites" && favoriteCount > 0 ? (
                    <span className="absolute -right-4 -top-2 inline-flex min-w-5 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/50 px-0.5 text-[10px] font-semibold text-white">
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
  );
}

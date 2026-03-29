"use client";

/** Collapsible nav rail for control-room sections; highlights active path and supports mobile tooltips. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType } from "react";
import {
  Activity,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  Heart,
  Home,
  Info,
  Inbox,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAdminShell } from "@/context/admin-shell-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAIN_NAV: readonly {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { href: "/admin/control-room", label: "Overview", icon: LayoutDashboard },
  {
    href: "/admin/control-room/composer",
    label: "Newsletter Composer",
    icon: Mail,
  },
  {
    href: "/admin/control-room/subscribers",
    label: "Subscribers Management",
    icon: Users,
  },
] as const;

const PROJECT_API_NAV: readonly {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    href: "/admin/control-room/api-docs",
    label: "API Documentation",
    icon: BookOpen,
  },
  {
    href: "/admin/control-room/api-status",
    label: "API Status",
    icon: Activity,
  },
] as const;

const SITE_LINKS: readonly {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { href: "/", label: "Home & Search", icon: Home },
  { href: "/about", label: "About", icon: Info },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/newsletter", label: "Newsletter Signup", icon: Inbox },
] as const;

function SidebarLinkRow({
  href,
  label,
  Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const linkClass = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
    active
      ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/35"
      : "text-slate-300 hover:bg-white/5 hover:text-white",
    collapsed && "justify-center gap-0 px-2 py-2.5",
  );

  const link = (
    <Link href={href} onClick={onNavigate} className={linkClass}>
      <Icon className="h-4 w-4 shrink-0 opacity-90" />
      <span className={cn("min-w-0 truncate", collapsed && "sr-only")}>
        {label}
      </span>
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-[14rem]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useAdminShell();
  const isLg = useMediaQuery("(min-width: 1024px)");
  /** Icon rail: mobile/tablet, or collapsed on large screens */
  const narrowSidebar = !isLg || Boolean(sidebarCollapsed && isLg);
  const effectiveCollapsed = narrowSidebar;

  const mainNavBody = (
    <>
      <p
        className={cn(
          "mb-2 px-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500",
          effectiveCollapsed && "hidden",
        )}
      >
        Admin Panel
      </p>
      {MAIN_NAV.map((item) => {
        const active =
          item.href === "/admin/control-room"
            ? pathname === "/admin/control-room"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <SidebarLinkRow
            key={item.href}
            href={item.href}
            label={item.label}
            Icon={item.icon}
            active={active}
            collapsed={effectiveCollapsed}
          />
        );
      })}
    </>
  );

  const projectApiNavBody = (
    <>
      <p
        className={cn(
          "mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500",
          effectiveCollapsed && "hidden",
        )}
      >
        Project API
      </p>
      {PROJECT_API_NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <SidebarLinkRow
            key={item.href}
            href={item.href}
            label={item.label}
            Icon={item.icon}
            active={active}
            collapsed={effectiveCollapsed}
          />
        );
      })}
    </>
  );

  const siteSection = (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p
        className={cn(
          "mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500",
          effectiveCollapsed && "hidden",
        )}
      >
        Cocktails &amp; Site
      </p>
      <div className="flex flex-col gap-1">
        {SITE_LINKS.map((item) => {
          const active = pathname === item.href;
          return (
            <SidebarLinkRow
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={active}
              collapsed={effectiveCollapsed}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <aside
      aria-label="Admin navigation"
      className={cn(
        "fixed left-0 top-0 z-[56] flex h-screen translate-x-0 flex-col border-r border-white/10 bg-slate-950/95 backdrop-blur-xl transition-[width] duration-200 ease-out",
        narrowSidebar ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex min-h-[4rem] items-center border-b border-white/10 py-2.5",
          narrowSidebar ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        {!narrowSidebar ? (
          <span className="flex min-w-0 items-center gap-2">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-emerald-400/95"
              aria-hidden
            />
            <span className="truncate text-sm font-semibold text-white">
              Control Room
            </span>
          </span>
        ) : !isLg ? (
          <span
            className="flex items-center justify-center"
            title="Control Room"
          >
            <ShieldCheck
              className="h-5 w-5 shrink-0 text-emerald-400/95"
              aria-hidden
            />
          </span>
        ) : null}
        {isLg ? (
          <button
            type="button"
            className={cn(
              "rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-100",
              narrowSidebar ? "inline-flex" : "hidden lg:inline-flex",
            )}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => toggleSidebarCollapsed()}
          >
            {sidebarCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-1 md:p-2">
        {mainNavBody}
        <div className="mt-2 border-t border-white/10 pt-2 md:mt-3 md:pt-3">
          {projectApiNavBody}
        </div>
        {siteSection}
      </nav>
    </aside>
  );
}

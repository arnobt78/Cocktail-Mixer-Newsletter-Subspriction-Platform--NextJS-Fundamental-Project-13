/** Quick links from admin to public-facing routes for manual QA. */
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AdminAccessDialog } from "@/components/admin/AdminAccessDialog";
import { getAdminShellGate } from "@/lib/admin-shell-gate";

const LINKS = [
  { href: "/", label: "Home & Search" },
  { href: "/about", label: "About" },
  { href: "/favorites", label: "Favorites" },
  { href: "/newsletter", label: "Newsletter Signup" },
] as const;

export default async function ControlRoomExplorePage() {
  const shell = await getAdminShellGate();

  if (shell.state === "missing-env") {
    return (
      <section className="mx-auto w-full max-w-9xl px-4 py-10 sm:px-8">
        <Card className="glass-panel border-amber-300/30 bg-amber-500/10 p-6 text-amber-100">
          Set `ADMIN_DASHBOARD_KEY` in `.env` to enable the admin control room.
        </Card>
      </section>
    );
  }

  if (shell.state === "unauthenticated") {
    return <AdminAccessDialog />;
  }

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <h1 className="text-2xl font-bold text-white font-heading">
        Cocktails & Site
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        Quick links to public pages (opens in the same tab).
      </p>
      <Card className="mt-6 glass-panel border-white/15 bg-white/[0.03] p-5">
        <ul className="space-y-2">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm font-medium text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

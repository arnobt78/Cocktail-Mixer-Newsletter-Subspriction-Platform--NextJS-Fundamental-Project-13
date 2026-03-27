import { cookies } from "next/headers";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  UserPlus,
  UserMinus,
  Clock3,
  Download,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getControlRoomSummary } from "@/lib/newsletter/control-room";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";
import { AdminAccessDialog } from "@/components/admin/AdminAccessDialog";
import { BroadcastComposer } from "@/components/admin/BroadcastComposer";

export default async function ControlRoomPage() {
  const expectedKey = process.env.ADMIN_DASHBOARD_KEY;
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  const isAllowed = verifyAdminSessionValue(sessionValue);

  if (!expectedKey) {
    return (
      <section className="mx-auto w-full max-w-9xl px-4 py-10 sm:px-8">
        <Card className="glass-panel border-amber-300/30 bg-amber-500/10 p-6 text-amber-100">
          Set `ADMIN_DASHBOARD_KEY` in `.env` to enable the admin control room.
        </Card>
      </section>
    );
  }

  if (!isAllowed) {
    return <AdminAccessDialog />;
  }

  const summary = await getControlRoomSummary();
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Not configured";
  const replyToEmail = process.env.RESEND_REPLY_TO_EMAIL ?? "Not configured";

  const statCards = [
    {
      label: "Active subscribers",
      value: summary.activeCount,
      icon: Users,
      accent: "text-emerald-200",
    },
    {
      label: "Pending confirms",
      value: summary.pendingCount,
      icon: Clock3,
      accent: "text-cyan-200",
    },
    {
      label: "Confirmed total",
      value: summary.confirmedCount,
      icon: UserPlus,
      accent: "text-violet-200",
    },
    {
      label: "Unsubscribed",
      value: summary.unsubscribedCount,
      icon: UserMinus,
      accent: "text-rose-200",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-10 sm:px-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-500/20 text-emerald-200">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-white font-heading">Admin Control Room</h1>
          <p className="text-sm text-slate-300">
            Newsletter lifecycle, setup health, and user signals overview.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/api/admin/control-room/export"
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Link>
          <form action="/api/admin/session/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              className="glass-panel border-white/15 bg-white/[0.03] p-5 text-white"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
                <Icon className={`h-4 w-4 ${item.accent}`} />
              </div>
              <p className="text-3xl font-bold">{item.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Setup Checklist</h2>
          <div className="flex flex-wrap gap-2">
            {summary.setupChecklist.map((item) => (
              <Badge
                key={item.label}
                className={
                  item.ready
                    ? "bg-emerald-400/20 text-emerald-100 border border-emerald-300/30"
                    : "bg-rose-400/20 text-rose-100 border border-rose-300/30"
                }
              >
                {item.label}: {item.ready ? "Ready" : "Missing"}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Unsubscribe Reasons</h2>
          {summary.reasonBreakdown.length === 0 ? (
            <p className="text-sm text-slate-300">No unsubscribe feedback yet.</p>
          ) : (
            <ul className="space-y-2">
              {summary.reasonBreakdown.map((item) => (
                <li key={item.reason} className="flex items-center justify-between text-sm text-slate-200">
                  <span className="capitalize">{item.reason.replaceAll("_", " ")}</span>
                  <Badge className="bg-cyan-400/20 text-cyan-100 border border-cyan-300/30">
                    {item.count}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Confirmed Users</h2>
          {summary.recentConfirmed.length === 0 ? (
            <p className="text-sm text-slate-300">No confirmed subscribers yet.</p>
          ) : (
            <ul className="space-y-2">
              {summary.recentConfirmed.map((item) => (
                <li
                  key={`${item.email}-${item.confirmedAt ?? item.createdAt}`}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm"
                >
                  <p className="font-medium text-slate-100">{item.fullName}</p>
                  <p className="text-slate-300">{item.email}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Pending Confirmations</h2>
          {summary.recentPending.length === 0 ? (
            <p className="text-sm text-slate-300">No pending confirmations.</p>
          ) : (
            <ul className="space-y-2">
              {summary.recentPending.map((item) => (
                <li
                  key={`${item.email}-${item.createdAt}`}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm"
                >
                  <p className="font-medium text-slate-100">{item.fullName}</p>
                  <p className="text-slate-300">{item.email}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <div className="mt-6">
        <BroadcastComposer
          initialDrafts={summary.recentDrafts}
          initialHistory={summary.recentBroadcasts}
          initialQueue={summary.recentQueue}
        />
      </div>
      <div className="mt-6">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Deliverability Checklist</h2>
          <ul className="space-y-2 text-sm text-slate-200">
            <li>
              SPF: include <code className="text-cyan-200">include:amazonses.com</code>{" "}
              in domain TXT record.
            </li>
            <li>DKIM: all Resend DKIM records should be verified.</li>
            <li>
              DMARC: add TXT <code className="text-cyan-200">v=DMARC1; p=none; rua=mailto:postmaster@your-domain.com</code>
              , then tighten policy later.
            </li>
            <li>Use same verified sender domain for all transactional sends.</li>
            <li>Keep click/open tracking off for transactional confirmation emails.</li>
          </ul>
        </Card>
      </div>
      <div className="mt-6">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Email Headers Preview</h2>
          <div className="space-y-2 text-sm text-slate-200">
            <p>
              <span className="text-slate-400">From:</span> {fromEmail}
            </p>
            <p>
              <span className="text-slate-400">Reply-To:</span> {replyToEmail}
            </p>
            <p>
              <span className="text-slate-400">List-Unsubscribe:</span> Included
              for welcome, digest, and broadcast emails
            </p>
            <p>
              <span className="text-slate-400">List-Unsubscribe-Post:</span>{" "}
              <code className="text-cyan-200">List-Unsubscribe=One-Click</code>
            </p>
            <p>
              <span className="text-slate-400">Subject token:</span> Ref
              timestamp + nonce is appended automatically
            </p>
            <p>
              <span className="text-slate-400">Tracking mode:</span> Keep click/open
              tracking OFF in Resend for transactional sends
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}

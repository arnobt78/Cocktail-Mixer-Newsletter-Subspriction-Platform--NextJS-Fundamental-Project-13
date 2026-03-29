"use client";

/** KPI cards + checklist driven by ControlRoomSummary (from SSR initialData + polling via useAdminSummaryQuery). */
import { useMemo } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  Clock3,
  CircleCheck,
  FileStack,
  History,
  CalendarClock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollPanel } from "@/components/ui/scroll-panel";
import type { ControlRoomSummary } from "@/lib/newsletter/control-room";
import { useAdminSummaryQuery } from "@/hooks/use-admin-summary-query";

interface AdminOverviewDashboardProps {
  initialSummary: ControlRoomSummary;
  fromEmail: string;
  replyToEmail: string;
}

export function AdminOverviewDashboard({
  initialSummary,
  fromEmail,
  replyToEmail,
}: AdminOverviewDashboardProps) {
  const { data: summary = initialSummary } =
    useAdminSummaryQuery(initialSummary);

  const deliveredCount = useMemo(
    () => summary.allHistory.reduce((s, h) => s + (h.sentCount ?? 0), 0),
    [summary.allHistory],
  );
  const failedQueueJobs = useMemo(
    () => summary.allQueue.filter((q) => q.status === "failed").length,
    [summary.allQueue],
  );
  const issueSignals = summary.deadLetterCount + failedQueueJobs;

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

  const listCountCards = [
    {
      label: "Saved drafts",
      value: summary.allDrafts.length,
      icon: FileStack,
      accent: "text-violet-200",
    },
    {
      label: "Resend history",
      value: summary.allHistory.length,
      icon: History,
      accent: "text-cyan-200",
    },
    {
      label: "Scheduled queue",
      value: summary.allQueue.length,
      icon: CalendarClock,
      accent: "text-amber-200",
    },
  ];

  const reasonEntriesTotal = summary.reasonBreakdown.reduce(
    (s, r) => s + r.count,
    0,
  );

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              className="glass-panel border-white/15 bg-white/[0.03] p-5 text-white"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  {item.label}
                </p>
                <Icon className={`h-4 w-4 ${item.accent}`} />
              </div>
              <p className="text-3xl font-bold">{item.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5 text-white">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
              Email delivery
            </p>
            <CircleCheck className="h-4 w-4 text-emerald-200" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="border border-emerald-300/40 bg-emerald-500/20 text-emerald-100">
              Delivered {deliveredCount}
            </Badge>
            <Badge className="border border-rose-300/40 bg-rose-500/20 text-rose-100">
              Issues {issueSignals}
            </Badge>
          </div>
          <p className="mt-2 text-xs leading-snug text-slate-400">
            Delivered = sum of recipients in resend history. Issues =
            dead-letter records + failed queue jobs ({summary.deadLetterCount} +{" "}
            {failedQueueJobs}).
          </p>
        </Card>
        {listCountCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              className="glass-panel border-white/15 bg-white/[0.03] p-5 text-white"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  {item.label}
                </p>
                <Icon className={`h-4 w-4 ${item.accent}`} />
              </div>
              <p className="text-3xl font-bold">{item.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Setup Checklist
          </h2>
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
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              Unsubscribe Reasons
            </h2>
            <Badge className="border border-cyan-300/40 bg-cyan-500/15 text-cyan-100">
              {reasonEntriesTotal}
            </Badge>
          </div>
          {summary.reasonBreakdown.length === 0 ? (
            <p className="text-sm text-slate-300">
              No unsubscribe feedback yet.
            </p>
          ) : (
            <ScrollPanel>
              <ul className="space-y-2">
                {summary.reasonBreakdown.map((item) => (
                  <li
                    key={item.reason}
                    className="flex w-full items-center justify-between gap-2 text-sm text-slate-200"
                  >
                    <span className="capitalize">
                      {item.reason.replaceAll("_", " ")}
                    </span>
                    <Badge className="shrink-0 bg-cyan-400/20 text-cyan-100 border border-cyan-300/30">
                      {item.count}
                    </Badge>
                  </li>
                ))}
              </ul>
            </ScrollPanel>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              Confirmed subscribers
            </h2>
            <Badge className="border border-emerald-300/40 bg-emerald-500/15 text-emerald-100">
              {summary.allConfirmedSubscribers.length}
            </Badge>
          </div>
          {summary.allConfirmedSubscribers.length === 0 ? (
            <p className="text-sm text-slate-300">
              No confirmed subscribers yet.
            </p>
          ) : (
            <ScrollPanel>
              <ul className="space-y-2">
                {summary.allConfirmedSubscribers.map((item) => (
                  <li
                    key={`${item.email}-${item.confirmedAt ?? item.createdAt}`}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm"
                  >
                    <p className="font-medium text-slate-100">
                      {item.fullName}
                    </p>
                    <p className="text-slate-300">{item.email}</p>
                  </li>
                ))}
              </ul>
            </ScrollPanel>
          )}
        </Card>

        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              Pending confirmations
            </h2>
            <Badge className="border border-amber-300/40 bg-amber-500/15 text-amber-100">
              {summary.allPendingSubscribers.length}
            </Badge>
          </div>
          {summary.allPendingSubscribers.length === 0 ? (
            <p className="text-sm text-slate-300">No pending confirmations.</p>
          ) : (
            <ScrollPanel>
              <ul className="space-y-2">
                {summary.allPendingSubscribers.map((item) => (
                  <li
                    key={`${item.email}-${item.createdAt}`}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm"
                  >
                    <p className="font-medium text-slate-100">
                      {item.fullName}
                    </p>
                    <p className="text-slate-300">{item.email}</p>
                  </li>
                ))}
              </ul>
            </ScrollPanel>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">
            Deliverability Checklist
          </h2>
          <ul className="space-y-2 text-sm text-slate-200">
            <li>
              SPF: include{" "}
              <code className="text-cyan-200">include:amazonses.com</code> in
              domain TXT record.
            </li>
            <li>DKIM: all Resend DKIM records should be verified.</li>
            <li>
              DMARC: add TXT{" "}
              <code className="text-cyan-200">
                v=DMARC1; p=none; rua=mailto:postmaster@your-domain.com
              </code>
              , then tighten policy later.
            </li>
            <li>
              Use same verified sender domain for all transactional sends.
            </li>
            <li>
              Keep click/open tracking off for transactional confirmation
              emails.
            </li>
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">
            Email Headers Preview
          </h2>
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
              <span className="text-slate-400">Tracking mode:</span> Keep
              click/open tracking OFF in Resend for transactional sends
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}

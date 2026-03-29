/** Loading placeholders for Suspense boundaries in admin routes (match real layout density). */
import type { ComponentType } from "react";
import {
  CalendarClock,
  CircleCheck,
  Clock3,
  FileStack,
  History,
  Megaphone,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollPanel } from "@/components/ui/scroll-panel";
import { cn } from "@/lib/utils";

/** `span` keeps pulses valid inside `<p>`; default `block` preserves stacked layouts (`inline-block` in className overrides). */
function Pulse({ className }: { className?: string }) {
  return (
    <span
      className={cn("block animate-pulse rounded-md bg-slate-600/35", className)}
      aria-hidden
    />
  );
}

function StatCardSkeleton({
  label,
  Icon,
  accent,
}: {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card className="glass-panel border-white/15 bg-white/[0.03] p-5 text-white">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{label}</p>
        <Icon className={cn("h-4 w-4", accent)} />
      </div>
      <Pulse className="h-9 w-16" />
    </Card>
  );
}

/** Matches overview layout: only counts, lists, and env-driven lines use pulse; checklist + deliverability stay static. */
export function AdminOverviewPageSkeleton() {
  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCardSkeleton label="Active subscribers" Icon={Users} accent="text-emerald-200" />
        <StatCardSkeleton label="Pending confirms" Icon={Clock3} accent="text-cyan-200" />
        <StatCardSkeleton label="Confirmed total" Icon={UserPlus} accent="text-violet-200" />
        <StatCardSkeleton label="Unsubscribed" Icon={UserMinus} accent="text-rose-200" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5 text-white">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Email delivery</p>
            <CircleCheck className="h-4 w-4 text-emerald-200" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pulse className="h-6 w-28 rounded-full" />
            <Pulse className="h-6 w-24 rounded-full" />
          </div>
          <p className="mt-2 text-xs leading-snug text-slate-400">
            Delivered = sum of recipients in resend history. Issues = dead-letter records + failed
            queue jobs (
            <Pulse className="inline-block h-3 w-4 align-middle" /> +{" "}
            <Pulse className="inline-block h-3 w-4 align-middle" />
            ).
          </p>
        </Card>
        <StatCardSkeleton label="Saved drafts" Icon={FileStack} accent="text-violet-200" />
        <StatCardSkeleton label="Resend history" Icon={History} accent="text-cyan-200" />
        <StatCardSkeleton label="Scheduled queue" Icon={CalendarClock} accent="text-amber-200" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Setup Checklist</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Pulse key={i} className="h-7 min-w-[8rem] flex-1 rounded-full sm:min-w-[10rem]" />
            ))}
          </div>
        </Card>

        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Unsubscribe Reasons</h2>
            <Badge className="border border-cyan-300/40 bg-cyan-500/15 text-cyan-100">
              <Pulse className="h-4 w-6 bg-cyan-400/30" />
            </Badge>
          </div>
          <ScrollPanel className="min-h-[12rem] max-h-[min(24rem,45vh)]">
            <ul className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex w-full items-center justify-between gap-2">
                  <Pulse className="h-4 flex-1 max-w-[12rem]" />
                  <Pulse className="h-6 w-10 shrink-0 rounded-full" />
                </li>
              ))}
            </ul>
          </ScrollPanel>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Confirmed subscribers</h2>
            <Badge className="border border-emerald-300/40 bg-emerald-500/15 text-emerald-100">
              <Pulse className="h-4 w-8 bg-emerald-400/30" />
            </Badge>
          </div>
          <ScrollPanel>
            <ul className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm"
                >
                  <Pulse className="mb-2 h-4 w-40" />
                  <Pulse className="h-3 w-56" />
                </li>
              ))}
            </ul>
          </ScrollPanel>
        </Card>

        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Pending confirmations</h2>
            <Badge className="border border-amber-300/40 bg-amber-500/15 text-amber-100">
              <Pulse className="h-4 w-8 bg-amber-400/30" />
            </Badge>
          </div>
          <ScrollPanel>
            <ul className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <li
                  key={i}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm"
                >
                  <Pulse className="mb-2 h-4 w-36" />
                  <Pulse className="h-3 w-52" />
                </li>
              ))}
            </ul>
          </ScrollPanel>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Deliverability Checklist</h2>
          <ul className="space-y-2 text-sm text-slate-200">
            <li>
              SPF: include <code className="text-cyan-200">include:amazonses.com</code> in domain TXT
              record.
            </li>
            <li>DKIM: all Resend DKIM records should be verified.</li>
            <li>
              DMARC: add TXT{" "}
              <code className="text-cyan-200">
                v=DMARC1; p=none; rua=mailto:postmaster@your-domain.com
              </code>
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
              <span className="text-slate-400">From:</span> <Pulse className="ml-1 inline-block h-4 w-64 max-w-full align-middle" />
            </p>
            <p>
              <span className="text-slate-400">Reply-To:</span>{" "}
              <Pulse className="ml-1 inline-block h-4 w-56 max-w-full align-middle" />
            </p>
            <p>
              <span className="text-slate-400">List-Unsubscribe:</span> Included for welcome, digest, and
              broadcast emails
            </p>
            <p>
              <span className="text-slate-400">List-Unsubscribe-Post:</span>{" "}
              <code className="text-cyan-200">List-Unsubscribe=One-Click</code>
            </p>
            <p>
              <span className="text-slate-400">Subject token:</span> Ref timestamp + nonce is appended
              automatically
            </p>
            <p>
              <span className="text-slate-400">Tracking mode:</span> Keep click/open tracking OFF in Resend
              for transactional sends
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}

function ListBlockSkeleton({
  title,
  badgeClass,
}: {
  title: string;
  badgeClass: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <Badge className={badgeClass}>
            <Pulse className="h-3.5 w-6 bg-white/20" />
          </Badge>
        </div>
        <span className="text-xs font-medium text-rose-300/50">Delete all</span>
      </div>
      <ScrollPanel className="max-h-[min(28rem,50vh)]">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <Pulse className="mb-2 h-4 w-[85%]" />
              <Pulse className="mb-2 h-3 w-[70%]" />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Pulse className="h-3 w-32" />
                <Pulse className="h-3 w-24" />
                <div className="flex gap-2">
                  <Pulse className="h-8 w-8 rounded-md" />
                  <Pulse className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollPanel>
    </div>
  );
}

/** Composer shell + form controls static; list regions pulse (drafts / history / queue). */
export function AdminComposerPageSkeleton() {
  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <div className="scroll-mt-28" id="newsletter-post-composer">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-cyan-200" />
            <h2 className="text-lg font-semibold text-white">Newsletter Post Composer</h2>
          </div>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              Create announcements, offers, and product updates for all active subscribers.
            </p>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled
                className="rounded-lg border border-violet-300/35 bg-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-100 opacity-90"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI draft helper
                </span>
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <Pulse className="h-10 w-full" />
            <Pulse className="h-10 w-full" />
            <Pulse className="min-h-36 w-full" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Pulse className="h-10 w-full" />
              <Pulse className="h-10 w-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-300">
                  Audience
                </span>
                <Pulse className="h-10 w-full" />
              </div>
              <div className="min-w-0">
                <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-300">
                  Scheduled send time (optional)
                </span>
                <Pulse className="h-10 w-full" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Pulse className="h-10 w-full" />
              <button
                type="button"
                disabled
                className="rounded-lg border border-cyan-300/30 bg-cyan-500/75 px-4 py-2.5 text-sm font-semibold text-white opacity-70"
              >
                Send test email to myself
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled
                className="rounded-lg border border-violet-300/30 bg-violet-500/70 px-4 py-2.5 text-sm font-semibold text-white opacity-70"
              >
                Save draft
              </button>
              <button
                type="button"
                disabled
                className="rounded-lg border border-emerald-300/30 bg-emerald-500/85 px-4 py-2.5 text-sm font-semibold text-white opacity-70"
              >
                Send Post to Subscribers
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ListBlockSkeleton
              title="Saved Drafts"
              badgeClass="border border-violet-300/35 bg-violet-500/20 text-violet-100"
            />
            <ListBlockSkeleton
              title="Resend History"
              badgeClass="border border-cyan-300/35 bg-cyan-500/20 text-cyan-100"
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">Scheduled Queue</h3>
              <Badge className="border border-amber-300/35 bg-amber-500/20 text-amber-100">
                <Pulse className="h-3.5 w-6 bg-white/20" />
              </Badge>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-slate-400">
              &ldquo;Process scheduled queue&rdquo; sends only campaigns whose scheduled time is{" "}
              <span className="text-slate-300">already due</span> (past or now). It does{" "}
              <span className="text-slate-300">not</span> send future-scheduled posts early—edit the row to
              move the time sooner, then process again after that time.
            </p>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled
                className="h-10 max-w-xs rounded-lg border border-amber-300/30 bg-amber-500/75 px-4 py-2 text-sm font-semibold text-white opacity-70 sm:w-auto"
              >
                Process scheduled queue now
              </button>
              <span className="text-xs font-medium text-rose-300/50 sm:text-right">
                Delete all
              </span>
            </div>
            <ScrollPanel className="max-h-[min(28rem,50vh)]">
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <Pulse className="mb-2 h-4 w-[90%]" />
                    <Pulse className="mb-2 h-3 w-full max-w-md" />
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3">
                      <Pulse className="h-3 w-56" />
                      <Pulse className="h-3 w-44" />
                      <div className="flex gap-2 sm:ml-auto">
                        <Pulse className="h-8 w-8 rounded-md" />
                        <Pulse className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollPanel>
          </div>
        </Card>
      </div>
    </section>
  );
}

function SubscriberColumnSkeleton({
  title,
  badgeClass,
  rows,
}: {
  title: string;
  badgeClass: string;
  rows: number;
}) {
  return (
    <Card className="glass-panel border-white/15 bg-white/[0.03] p-5 text-white">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge className={badgeClass}>
          <Pulse className="h-4 w-8 bg-white/20" />
        </Badge>
      </div>
      <ScrollPanel className="max-h-[min(32rem,55vh)]">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="flex justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Pulse className="mb-2 h-4 w-full max-w-xs" />
                  <Pulse className="h-3 w-full max-w-sm" />
                </div>
                <div className="flex gap-1">
                  <Pulse className="h-8 w-8 rounded-md" />
                  <Pulse className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollPanel>
    </Card>
  );
}

export function AdminSubscribersPageSkeleton() {
  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-heading">Subscribers</h1>
        <p className="mt-1 text-sm text-slate-400">
          Directory entries, pending confirmations, and removals. Changes sync with the overview
          dashboard.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SubscriberColumnSkeleton
          title="Active subscribers"
          badgeClass="border border-emerald-300/35 bg-emerald-500/20 text-emerald-100"
          rows={3}
        />
        <SubscriberColumnSkeleton
          title="Pending confirmation"
          badgeClass="border border-cyan-300/35 bg-cyan-500/20 text-cyan-100"
          rows={2}
        />
      </div>

      <Card className="mt-6 glass-panel border-white/15 bg-white/[0.03] p-5 text-white lg:col-span-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Other directory records</h2>
          <Badge className="border border-slate-400/35 bg-slate-500/15 text-slate-200">
            <Pulse className="h-4 w-8 bg-white/15" />
          </Badge>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          Unsubscribed or never confirmed rows still stored in Redis. You can update names or delete the
          record.
        </p>
        <ScrollPanel className="max-h-[min(28rem,45vh)]">
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <Pulse className="mb-2 h-4 w-64 max-w-full" />
                <Pulse className="h-3 w-48 max-w-full" />
              </div>
            ))}
          </div>
        </ScrollPanel>
      </Card>
    </section>
  );
}

export function AdminApiDocsPageSkeleton() {
  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <div className="mb-6">
        <Pulse className="h-8 w-64 max-w-full sm:h-9" />
        <Pulse className="mt-2 h-4 w-full max-w-xl" />
      </div>
      <Pulse className="mb-4 h-11 w-full max-w-2xl rounded-xl" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="glass-panel border-white/10 bg-white/[0.03] p-5">
            <Pulse className="h-4 w-full max-w-md" />
            <Pulse className="mt-3 h-16 w-full" />
            <div className="mt-4 flex gap-2">
              <Pulse className="h-6 w-14 rounded-md" />
              <Pulse className="h-6 w-14 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function AdminApiStatusPageSkeleton() {
  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <Pulse className="h-8 w-48 max-w-full sm:h-9" />
          <Pulse className="mt-2 h-4 w-full max-w-xl" />
        </div>
        <Pulse className="h-10 w-32 shrink-0 rounded-lg" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel border-white/10 bg-white/[0.03] p-5">
          <Pulse className="h-4 w-40" />
          <Pulse className="mt-4 h-8 w-32" />
        </Card>
        <Card className="glass-panel border-white/10 bg-white/[0.03] p-5">
          <Pulse className="h-4 w-32" />
          <Pulse className="mt-4 h-10 w-full" />
        </Card>
      </div>
      <Card className="mt-4 glass-panel border-white/10 bg-white/[0.03] p-5 sm:mt-5">
        <Pulse className="h-5 w-48" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Pulse key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    </section>
  );
}

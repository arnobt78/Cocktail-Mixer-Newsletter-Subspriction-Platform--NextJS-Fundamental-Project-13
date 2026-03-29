"use client";

/** Admin table for pending + confirmed subscribers: TanStack Query + mutations to /api/admin/subscribers. */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Pencil, Trash2, X, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/ui/ripple-button";
import { ScrollPanel } from "@/components/ui/scroll-panel";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { activityToast } from "@/lib/activity-toast";
import { adminSummaryQueryKey } from "@/hooks/use-admin-summary-query";
import type {
  NewsletterSubscriber,
  UnsubscribeReason,
} from "@/types/newsletter";
import { formatAdminDateTime } from "@/lib/admin-datetime";
import { cn } from "@/lib/utils";

const UNSUBSCRIBE_REASON_LABELS: Record<UnsubscribeReason, string> = {
  too_many_emails: "Too many emails",
  not_relevant: "Not relevant to me",
  signed_up_by_mistake: "Signed up by mistake",
  prefer_another_channel: "Prefer another channel",
  other: "Other",
};

function formatUnsubscribeReason(reason: UnsubscribeReason): string {
  return UNSUBSCRIBE_REASON_LABELS[reason] ?? reason;
}

const SUBSCRIBERS_QUERY_KEY = ["admin", "subscribers"] as const;

function contactSummary(row: NewsletterSubscriber): string {
  const name =
    row.fullName?.trim() || `${row.firstName} ${row.lastName}`.trim();
  return name ? `${name} (${row.email})` : row.email;
}

type SubscribersPayload = {
  ok: true;
  subscribers: NewsletterSubscriber[];
  pending: NewsletterSubscriber[];
};

async function fetchSubscribers(): Promise<SubscribersPayload> {
  const res = await fetch("/api/admin/subscribers");
  const json = (await res.json()) as
    | SubscribersPayload
    | { ok: false; message?: string };
  if (!res.ok || !("ok" in json) || !json.ok) {
    const msg =
      json &&
      typeof json === "object" &&
      "message" in json &&
      typeof json.message === "string"
        ? json.message
        : "Failed to load subscribers.";
    throw new Error(msg);
  }
  return json;
}

function showToast(ok: boolean, message: string, title?: string) {
  activityToast({
    icon: ok ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : (
      <XCircle className="h-4 w-4" />
    ),
    title: title ?? (ok ? "Done" : "Error"),
    description: message,
  });
}

interface SubscribersAdminPanelProps {
  initialSubscribers: NewsletterSubscriber[];
  initialPending: NewsletterSubscriber[];
}

export function SubscribersAdminPanel({
  initialSubscribers,
  initialPending,
}: SubscribersAdminPanelProps) {
  const queryClient = useQueryClient();
  const { data, isError, error, refetch } = useQuery({
    queryKey: SUBSCRIBERS_QUERY_KEY,
    queryFn: fetchSubscribers,
    initialData: {
      ok: true as const,
      subscribers: initialSubscribers,
      pending: initialPending,
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: ReactNode;
    onConfirm: (() => void) | null;
  }>({ open: false, title: "", description: "", onConfirm: null });

  const askConfirm = useCallback(
    (title: string, description: ReactNode, onConfirm: () => void) => {
      setConfirmState({ open: true, title, description, onConfirm });
    },
    [],
  );

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: SUBSCRIBERS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: adminSummaryQueryKey() });
  }, [queryClient]);

  const patchMutation = useMutation({
    mutationFn: async (vars: {
      email: string;
      kind: "subscriber" | "pending";
      firstName: string;
      lastName: string;
    }) => {
      const res = await fetch("/api/admin/subscribers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      const json = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.message ?? "Update failed.");
      }
    },
    onSuccess: (_data, vars) => {
      invalidateAll();
      const name = `${vars.firstName} ${vars.lastName}`.trim();
      const who = name ? `${name} (${vars.email})` : vars.email;
      const title =
        vars.kind === "pending"
          ? "Pending signup updated"
          : "Subscriber updated";
      showToast(true, `Saved names for ${who}.`, title);
    },
    onError: (e) => {
      showToast(false, e instanceof Error ? e.message : "Update failed.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (vars: {
      email: string;
      kind: "subscriber" | "pending";
      contactLabel: string;
    }) => {
      const res = await fetch("/api/admin/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: vars.email, kind: vars.kind }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.message ?? "Delete failed.");
      }
    },
    onSuccess: (_data, vars) => {
      invalidateAll();
      const title =
        vars.kind === "pending"
          ? "Pending signup removed"
          : "Subscriber removed";
      showToast(true, `${vars.contactLabel} was removed.`, title);
    },
    onError: (e) => {
      showToast(false, e instanceof Error ? e.message : "Delete failed.");
    },
  });

  const subscribers = data?.subscribers ?? initialSubscribers;
  const pending = data?.pending ?? initialPending;

  const activeList = useMemo(
    () =>
      subscribers.filter((s) => Boolean(s.confirmedAt) && !s.unsubscribedAt),
    [subscribers],
  );
  const inactiveList = useMemo(
    () =>
      subscribers.filter((s) => !(Boolean(s.confirmedAt) && !s.unsubscribedAt)),
    [subscribers],
  );

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-heading">
          Subscribers
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Directory entries, pending confirmations, and removals. Changes sync
          with the overview dashboard.
        </p>
      </div>

      {isError ? (
        <Card className="glass-panel border-rose-300/30 p-4 text-rose-100">
          <p className="text-sm">
            {error instanceof Error ? error.message : "Request failed."}
          </p>
          <RippleButton
            type="button"
            className="mt-3 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white"
            onClick={() => void refetch()}
          >
            Retry
          </RippleButton>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5 text-white">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Active subscribers</h2>
            <Badge className="border border-emerald-300/35 bg-emerald-500/20 text-emerald-100">
              {activeList.length}
            </Badge>
          </div>
          <ScrollPanel className="max-h-[min(32rem,55vh)]">
            <div className="space-y-3">
              {activeList.length === 0 ? (
                <p className="text-sm text-slate-400">No active subscribers.</p>
              ) : (
                activeList.map((row) => (
                  <SubscriberRow
                    key={row.email}
                    row={row}
                    kind="subscriber"
                    busy={patchMutation.isPending || deleteMutation.isPending}
                    onSave={(firstName, lastName) =>
                      patchMutation.mutate({
                        email: row.email,
                        kind: "subscriber",
                        firstName,
                        lastName,
                      })
                    }
                    onDelete={() =>
                      askConfirm(
                        "Remove subscriber",
                        <>
                          Remove{" "}
                          <span className="font-semibold text-emerald-200/90">
                            {row.email}
                          </span>{" "}
                          from the directory? This does not send email.
                        </>,
                        () =>
                          deleteMutation.mutate({
                            email: row.email,
                            kind: "subscriber",
                            contactLabel: contactSummary(row),
                          }),
                      )
                    }
                  />
                ))
              )}
            </div>
          </ScrollPanel>
        </Card>

        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5 text-white">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Pending confirmation</h2>
            <Badge className="border border-cyan-300/35 bg-cyan-500/20 text-cyan-100">
              {pending.length}
            </Badge>
          </div>
          <ScrollPanel className="max-h-[min(32rem,55vh)]">
            <div className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-sm text-slate-400">No pending signups.</p>
              ) : (
                pending.map((row) => (
                  <SubscriberRow
                    key={row.email}
                    row={row}
                    kind="pending"
                    busy={patchMutation.isPending || deleteMutation.isPending}
                    onSave={(firstName, lastName) =>
                      patchMutation.mutate({
                        email: row.email,
                        kind: "pending",
                        firstName,
                        lastName,
                      })
                    }
                    onDelete={() =>
                      askConfirm(
                        "Remove pending signup",
                        <>
                          Discard pending signup for{" "}
                          <span className="font-semibold text-cyan-200/90">
                            {row.email}
                          </span>
                          ?
                        </>,
                        () =>
                          deleteMutation.mutate({
                            email: row.email,
                            kind: "pending",
                            contactLabel: contactSummary(row),
                          }),
                      )
                    }
                  />
                ))
              )}
            </div>
          </ScrollPanel>
        </Card>

        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5 text-white lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Other directory records</h2>
            <Badge className="border border-slate-400/35 bg-slate-500/15 text-slate-200">
              {inactiveList.length}
            </Badge>
          </div>
          <p className="mb-3 text-xs text-slate-400">
            Unsubscribed or never confirmed rows still stored in Redis. You can
            update names or delete the record.
          </p>
          <ScrollPanel className="max-h-[min(28rem,45vh)]">
            <div className="space-y-3">
              {inactiveList.length === 0 ? (
                <p className="text-sm text-slate-400">No other records.</p>
              ) : (
                inactiveList.map((row) => (
                  <SubscriberRow
                    key={row.email}
                    row={row}
                    kind="subscriber"
                    busy={patchMutation.isPending || deleteMutation.isPending}
                    onSave={(firstName, lastName) =>
                      patchMutation.mutate({
                        email: row.email,
                        kind: "subscriber",
                        firstName,
                        lastName,
                      })
                    }
                    onDelete={() =>
                      askConfirm(
                        "Remove record",
                        <>
                          Remove directory record for{" "}
                          <span className="font-semibold text-slate-200">
                            {row.email}
                          </span>
                          ?
                        </>,
                        () =>
                          deleteMutation.mutate({
                            email: row.email,
                            kind: "subscriber",
                            contactLabel: contactSummary(row),
                          }),
                      )
                    }
                  />
                ))
              )}
            </div>
          </ScrollPanel>
        </Card>
      </div>

      <AlertDialog open={confirmState.open}>
        <AlertDialogOverlay />
        <AlertDialogContent className="glass-panel border-cyan-400/30">
          <AlertDialogHeader>
            <div>
              <AlertDialogTitle>{confirmState.title}</AlertDialogTitle>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {confirmState.description}
              </p>
            </div>
          </AlertDialogHeader>
          <div className="mt-4 flex items-center justify-end gap-2">
            <RippleButton
              type="button"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100"
              onClick={() =>
                setConfirmState((prev) => ({
                  ...prev,
                  open: false,
                  onConfirm: null,
                }))
              }
            >
              Cancel
            </RippleButton>
            <RippleButton
              type="button"
              className="rounded-lg border border-rose-300/30 bg-rose-500/70 px-3 py-2 text-xs font-semibold text-white"
              onClick={() => {
                const fn = confirmState.onConfirm;
                setConfirmState((prev) => ({
                  ...prev,
                  open: false,
                  onConfirm: null,
                }));
                if (fn) {
                  fn();
                }
              }}
            >
              Confirm
            </RippleButton>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function SubscriberRow({
  row,
  kind,
  busy,
  onSave,
  onDelete,
}: {
  row: NewsletterSubscriber;
  kind: "subscriber" | "pending";
  busy: boolean;
  onSave: (firstName: string, lastName: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(row.firstName);
  const [lastName, setLastName] = useState(row.lastName);

  const statusLabel = row.unsubscribedAt
    ? "Unsubscribed"
    : row.confirmedAt
      ? "Active"
      : "Not confirmed";

  const pendingSubmitted =
    kind === "pending" && row.createdAt
      ? ` · Submitted ${formatAdminDateTime(row.createdAt)}`
      : "";

  const showUnsubscribeDetails =
    Boolean(row.unsubscribedAt) &&
    (Boolean(row.unsubscribeReason) ||
      Boolean(row.unsubscribeFeedback?.trim()));

  return (
    <div className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">
            {row.email}
          </p>
          <p className="text-xs text-slate-500">
            {kind === "pending" ? (
              <>
                Pending
                {pendingSubmitted}
              </>
            ) : (
              <>
                {statusLabel}
                {row.confirmedAt
                  ? ` · Confirmed ${formatAdminDateTime(row.confirmedAt)}`
                  : null}
                {row.unsubscribedAt
                  ? ` · Left ${formatAdminDateTime(row.unsubscribedAt)}`
                  : null}
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            disabled={busy}
            className={cn(
              "rounded-md p-1.5 text-slate-300 transition hover:bg-white/10 disabled:opacity-40",
              editing
                ? "text-rose-200 hover:text-rose-100"
                : "hover:text-cyan-200",
            )}
            aria-label={editing ? "Cancel editing" : "Edit names"}
            onClick={() => {
              if (editing) {
                setFirstName(row.firstName);
                setLastName(row.lastName);
                setEditing(false);
              } else {
                setFirstName(row.firstName);
                setLastName(row.lastName);
                setEditing(true);
              }
            }}
          >
            {editing ? (
              <X className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-rose-200 disabled:opacity-40"
            aria-label="Delete"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {editing ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="border-white/15 bg-slate-900/50 text-slate-100 sm:flex-1"
          />
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="border-white/15 bg-slate-900/50 text-slate-100 sm:flex-1"
          />
          <RippleButton
            type="button"
            disabled={busy}
            className="rounded-lg border border-emerald-300/35 bg-emerald-600/80 px-3 py-2 text-xs font-semibold text-white"
            onClick={() => {
              onSave(firstName.trim(), lastName.trim());
              setEditing(false);
            }}
          >
            Save
          </RippleButton>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          {row.firstName} {row.lastName}
        </p>
      )}
      {showUnsubscribeDetails ? (
        <div className="mt-2 space-y-1.5 rounded-lg border border-rose-300/15 bg-rose-500/[0.06] px-2.5 py-2">
          {row.unsubscribeReason ? (
            <p className="text-xs leading-snug text-slate-200">
              <span className="font-semibold text-rose-200/90">Reason</span>
              <span className="text-slate-500"> · </span>
              {formatUnsubscribeReason(row.unsubscribeReason)}
            </p>
          ) : null}
          {row.unsubscribeFeedback?.trim() ? (
            <p
              className={cn(
                "text-xs leading-relaxed text-slate-400",
                row.unsubscribeReason && "border-t border-white/10 pt-1.5",
              )}
            >
              <span className="font-medium text-slate-500">Note</span>
              <span className="text-slate-600"> · </span>
              <span className="text-slate-300">&ldquo;{row.unsubscribeFeedback.trim()}&rdquo;</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

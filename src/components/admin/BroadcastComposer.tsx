"use client";

/**
 * Admin broadcast workspace: local form state + TanStack mutations calling control-room APIs.
 * Manages drafts, queue, history, test send, schedule, resend, and optional AI assist dialog.
 */
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useMutation } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  FilePenLine,
  Loader2,
  Mail,
  Megaphone,
  Pencil,
  PlayCircle,
  Save,
  SaveAll,
  Send,
  Sparkles,
  Trash2,
  Wand2,
  X,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollPanel } from "@/components/ui/scroll-panel";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/ui/ripple-button";
import { activityToast } from "@/lib/activity-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  BroadcastAudience,
  BroadcastDraft,
  BroadcastHistoryItem,
  BroadcastQueueItem,
} from "@/types/newsletter";
import { formatAdminDateTime } from "@/lib/admin-datetime";

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function broadcastAudienceLabel(audience: BroadcastAudience): string {
  switch (audience) {
    case "all":
      return "All active subscribers";
    case "recent":
      return "Only recent confirms (14 days)";
    case "engaged":
      return "Only engaged (30 days)";
    default:
      return audience;
  }
}

function queueStatusValueClassName(status: string): string {
  switch (status) {
    case "queued":
      return "font-medium text-amber-200";
    case "sent":
      return "font-medium text-emerald-300";
    case "failed":
      return "font-medium text-rose-300";
    default:
      return "font-medium text-slate-200";
  }
}

type ComposerViewDetailState =
  | { open: false }
  | { open: true; kind: "draft"; item: BroadcastDraft }
  | { open: true; kind: "history"; item: BroadcastHistoryItem }
  | { open: true; kind: "queue"; item: BroadcastQueueItem };

interface FormState {
  subject: string;
  preheader: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  audience: BroadcastAudience;
}

interface BroadcastComposerProps {
  initialDrafts: BroadcastDraft[];
  initialHistory: BroadcastHistoryItem[];
  initialQueue: BroadcastQueueItem[];
  onSummaryInvalidate?: () => void;
}

export function BroadcastComposer({
  initialDrafts,
  initialHistory,
  initialQueue,
  onSummaryInvalidate,
}: BroadcastComposerProps) {
  const [form, setForm] = useState<FormState>({
    subject: "",
    preheader: "",
    body: "",
    ctaLabel: "",
    ctaUrl: "",
    audience: "all",
  });
  const [isSending, setIsSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [drafts, setDrafts] = useState(initialDrafts);
  const [history, setHistory] = useState(initialHistory);
  const [queue, setQueue] = useState(initialQueue);
  const [scheduledFor, setScheduledFor] = useState("");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingQueueId, setEditingQueueId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: ReactNode;
    onConfirm: (() => void) | null;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: null,
  });
  const [viewDetail, setViewDetail] = useState<ComposerViewDetailState>({
    open: false,
  });
  const composerCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onSummaryInvalidate) {
      return;
    }
    const t = window.setTimeout(() => {
      onSummaryInvalidate();
    }, 450);
    return () => window.clearTimeout(t);
  }, [drafts, history, queue, onSummaryInvalidate]);

  const [aiAssistOpen, setAiAssistOpen] = useState(false);
  const [aiBrief, setAiBrief] = useState("");

  useEffect(() => {
    setDrafts(initialDrafts);
    setHistory(initialHistory);
    setQueue(initialQueue);
  }, [initialDrafts, initialHistory, initialQueue]);

  const aiMutation = useMutation({
    mutationFn: async (brief: string) => {
      const res = await fetch("/api/admin/ai/composer-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        message?: string;
        data?: {
          subject: string;
          preheader: string;
          body: string;
          ctaLabel?: string;
          ctaUrl?: string;
          audience?: BroadcastAudience;
          providerUsed: string;
        };
      };
      if (!res.ok || !json.ok || !json.data) {
        throw new Error(json.message ?? "AI assist failed.");
      }
      return json.data;
    },
    onSuccess: (data) => {
      setForm((prev) => ({
        ...prev,
        subject: data.subject,
        preheader: data.preheader,
        body: data.body,
        ctaLabel: data.ctaLabel ?? "",
        ctaUrl: data.ctaUrl ?? "",
        audience: data.audience ?? prev.audience,
      }));
      setAiAssistOpen(false);
      setAiBrief("");
      showToast(
        true,
        `Draft ideas filled via ${data.providerUsed}. Review every field before sending.`,
        "AI draft helper",
      );
    },
    onError: (e) => {
      showToast(
        false,
        e instanceof Error ? e.message : "AI request failed.",
        "AI draft helper",
      );
    },
  });

  function scrollComposerIntoView() {
    requestAnimationFrame(() => {
      composerCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const minScheduleLocal = (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  const hasComposerContent =
    form.subject.trim() !== "" ||
    form.preheader.trim() !== "" ||
    form.body.trim() !== "" ||
    form.ctaLabel.trim() !== "" ||
    form.ctaUrl.trim() !== "" ||
    scheduledFor !== "" ||
    testEmail.trim() !== "" ||
    form.audience !== "all";

  function clearComposerForm() {
    setForm({
      subject: "",
      preheader: "",
      body: "",
      ctaLabel: "",
      ctaUrl: "",
      audience: "all",
    });
    setScheduledFor("");
    setTestEmail("");
    setEditingDraftId(null);
    setEditingQueueId(null);
  }

  function cancelComposerEdit() {
    setEditingDraftId(null);
    setEditingQueueId(null);
  }

  function showToast(ok: boolean, message: string, title?: string) {
    activityToast({
      icon: ok ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      ),
      title: title ?? (ok ? "Action completed" : "Action failed"),
      description: message,
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    try {
      if (editingQueueId) {
        const label = form.subject.trim() || "Untitled";
        if (!scheduledFor.trim()) {
          showToast(
            false,
            "Pick a scheduled send time in the future.",
            "Schedule required",
          );
          return;
        }
        const response = await fetch("/api/admin/control-room/queue", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingQueueId,
            ...form,
            scheduledFor: new Date(scheduledFor).toISOString(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          message: string;
          item?: BroadcastQueueItem;
        };
        showToast(
          data.ok,
          data.ok ? `Queued send "${label}" was updated.` : data.message,
          data.ok ? `Queue updated — "${label}"` : "Queue update failed",
        );
        if (response.ok && data.ok) {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === editingQueueId
                ? (data.item ?? {
                    ...item,
                    ...form,
                    scheduledFor: new Date(scheduledFor).toISOString(),
                    updatedAt: new Date().toISOString(),
                  })
                : item,
            ),
          );
          setEditingQueueId(null);
        }
        return;
      }

      if (editingDraftId) {
        const label = form.subject.trim() || "Untitled";
        const response = await fetch("/api/admin/control-room/drafts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingDraftId, ...form }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          message: string;
          draft?: BroadcastDraft;
        };
        showToast(
          data.ok,
          data.ok
            ? `Your campaign "${label}" was updated in place.`
            : data.message,
          data.ok ? `Draft updated — "${label}"` : "Draft update failed",
        );
        if (response.ok && data.ok) {
          setDrafts((prev) =>
            prev.map((item) =>
              item.id === editingDraftId
                ? (data.draft ?? {
                    ...item,
                    ...form,
                    updatedAt: new Date().toISOString(),
                  })
                : item,
            ),
          );
          setEditingDraftId(null);
        }
        return;
      }

      const payload = {
        ...form,
        mode: "bulk",
        scheduledFor: scheduledFor || undefined,
      };

      const response = await fetch("/api/admin/control-room/send-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        queueItem?: BroadcastQueueItem;
      };
      showToast(data.ok, data.message, "Campaign send");
      if (data.ok) {
        setForm({
          subject: "",
          preheader: "",
          body: "",
          ctaLabel: "",
          ctaUrl: "",
          audience: "all",
        });
        setScheduledFor("");
        if (payload.scheduledFor && data.queueItem) {
          setQueue((prev) => [data.queueItem!, ...prev]);
        }
      }
    } finally {
      setIsSending(false);
    }
  }

  async function sendTest() {
    setIsSending(true);
    try {
      const response = await fetch("/api/admin/control-room/send-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mode: "test", testEmail }),
      });
      const data = (await response.json()) as { ok: boolean; message: string };
      showToast(data.ok, data.message, "Test send");
    } finally {
      setIsSending(false);
    }
  }

  async function saveDraft() {
    const label = form.subject.trim() || "Untitled";

    if (editingDraftId) {
      const response = await fetch("/api/admin/control-room/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingDraftId, ...form }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        draft?: BroadcastDraft;
      };
      showToast(
        data.ok,
        data.ok
          ? `Draft "${label}" was updated — your saved list now shows the latest version.`
          : data.message,
        data.ok ? `Draft updated — "${label}"` : "Draft update failed",
      );
      if (response.ok && data.ok) {
        setDrafts((prev) =>
          prev.map((item) =>
            item.id === editingDraftId
              ? (data.draft ?? {
                  ...item,
                  ...form,
                  updatedAt: new Date().toISOString(),
                })
              : item,
          ),
        );
      }
      return;
    }

    const response = await fetch("/api/admin/control-room/save-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json()) as {
      ok: boolean;
      message: string;
      draft?: BroadcastDraft;
    };
    showToast(
      data.ok,
      data.ok && data.draft
        ? `New draft "${label}" was saved to your list.`
        : data.message,
      data.ok ? `Draft saved — "${label}"` : "Draft save failed",
    );
    if (response.ok && data.ok && data.draft) {
      setDrafts((prev) => [data.draft!, ...prev]);
    }
  }

  async function resendFrom(sourceId: string, sourceType: "draft" | "history") {
    const response = await fetch("/api/admin/control-room/resend-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId, sourceType }),
    });
    const data = (await response.json()) as { ok: boolean; message: string };
    showToast(data.ok, data.message, "Resend campaign");
    if (response.ok && data.ok) {
      const sourceItem =
        sourceType === "draft"
          ? drafts.find((item) => item.id === sourceId)
          : history.find((item) => item.id === sourceId);
      if (!sourceItem) {
        return;
      }
      setHistory((prev) => [
        {
          ...sourceItem,
          id: `local-${Date.now()}`,
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          sentCount: 0,
        },
        ...prev,
      ]);
    }
  }

  async function runQueueNow() {
    const response = await fetch("/api/admin/control-room/process-queue", {
      method: "POST",
    });
    const data = (await response.json()) as {
      ok: boolean;
      message: string;
      processed?: number;
    };
    showToast(
      data.ok,
      data.ok
        ? `${data.message} Processed: ${data.processed ?? 0}`
        : data.message,
      "Queue processing",
    );
    if (response.ok && data.ok) {
      const listRes = await fetch("/api/admin/control-room/queue");
      const listData = (await listRes.json()) as {
        ok: boolean;
        items?: BroadcastQueueItem[];
      };
      if (listData.ok && listData.items) {
        setQueue(listData.items);
      }
    }
  }

  function loadDraftToEditor(draft: BroadcastDraft) {
    setEditingQueueId(null);
    setForm({
      subject: draft.subject,
      preheader: draft.preheader,
      body: draft.body,
      ctaLabel: draft.ctaLabel ?? "",
      ctaUrl: draft.ctaUrl ?? "",
      audience: draft.audience,
    });
    setEditingDraftId(draft.id);
    setScheduledFor("");
    const label = draft.subject.trim() || "Untitled";
    showToast(
      true,
      `Composer is now editing "${label}". Save draft (overwrite) keeps you here; Update draft saves and exits.`,
      `Editing draft — "${label}"`,
    );
    scrollComposerIntoView();
  }

  function loadQueueToEditor(item: BroadcastQueueItem) {
    setEditingDraftId(null);
    setForm({
      subject: item.subject,
      preheader: item.preheader,
      body: item.body,
      ctaLabel: item.ctaLabel ?? "",
      ctaUrl: item.ctaUrl ?? "",
      audience: item.audience,
    });
    setScheduledFor(isoToDatetimeLocal(item.scheduledFor));
    setEditingQueueId(item.id);
    const label = item.subject.trim() || "Untitled";
    showToast(
      true,
      `Editing queued send "${label}". Change the schedule or copy, then Update queued send.`,
      `Queue edit — "${label}"`,
    );
    scrollComposerIntoView();
  }

  async function deleteDraft(id: string) {
    const label = drafts.find((d) => d.id === id)?.subject.trim() || "Untitled";
    const response = await fetch(
      `/api/admin/control-room/drafts?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
    const data = (await response.json()) as { ok: boolean; message: string };
    showToast(
      data.ok,
      data.ok ? `Removed "${label}" from saved drafts.` : data.message,
      data.ok ? `Draft deleted — "${label}"` : "Draft delete failed",
    );
    if (response.ok && data.ok) {
      setDrafts((prev) => prev.filter((item) => item.id !== id));
      if (editingDraftId === id) {
        setEditingDraftId(null);
      }
    }
  }

  async function deleteAllDrafts() {
    const n = drafts.length;
    const response = await fetch("/api/admin/control-room/drafts", {
      method: "DELETE",
    });
    const data = (await response.json()) as { ok: boolean; message: string };
    showToast(
      data.ok,
      data.ok
        ? `All ${n} saved draft${n === 1 ? "" : "s"} were removed permanently.`
        : data.message,
      data.ok
        ? `Cleared ${n} draft${n === 1 ? "" : "s"}`
        : "Delete all drafts failed",
    );
    if (response.ok && data.ok) {
      setDrafts([]);
      setEditingDraftId(null);
    }
  }

  async function deleteHistoryItem(id: string) {
    const label =
      history.find((h) => h.id === id)?.subject.trim() || "Untitled";
    const response = await fetch(
      `/api/admin/control-room/history?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
    const data = (await response.json()) as { ok: boolean; message: string };
    showToast(
      data.ok,
      data.ok ? `Removed "${label}" from resend history.` : data.message,
      data.ok ? `History deleted — "${label}"` : "History delete failed",
    );
    if (response.ok && data.ok) {
      setHistory((prev) => prev.filter((item) => item.id !== id));
    }
  }

  async function deleteAllHistory() {
    const n = history.length;
    const response = await fetch("/api/admin/control-room/history", {
      method: "DELETE",
    });
    const data = (await response.json()) as { ok: boolean; message: string };
    showToast(
      data.ok,
      data.ok
        ? `All ${n} resend history entr${n === 1 ? "y was" : "ies were"} removed permanently.`
        : data.message,
      data.ok
        ? `Cleared ${n} histor${n === 1 ? "y item" : "y items"}`
        : "Delete all history failed",
    );
    if (response.ok && data.ok) {
      setHistory([]);
    }
  }

  async function deleteQueueItem(id: string) {
    const label = queue.find((q) => q.id === id)?.subject.trim() || "Untitled";
    const response = await fetch(
      `/api/admin/control-room/queue?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
    const data = (await response.json()) as { ok: boolean; message: string };
    showToast(
      data.ok,
      data.ok ? `Removed "${label}" from the scheduled queue.` : data.message,
      data.ok ? `Queue item removed — "${label}"` : "Queue delete failed",
    );
    if (response.ok && data.ok) {
      setQueue((prev) => prev.filter((item) => item.id !== id));
      if (editingQueueId === id) {
        setEditingQueueId(null);
      }
    }
  }

  async function deleteAllQueue() {
    const n = queue.length;
    const response = await fetch("/api/admin/control-room/queue", {
      method: "DELETE",
    });
    const data = (await response.json()) as { ok: boolean; message: string };
    showToast(
      data.ok,
      data.ok
        ? `All ${n} scheduled queue entr${n === 1 ? "y was" : "ies were"} removed.`
        : data.message,
      data.ok
        ? `Cleared ${n} queue item${n === 1 ? "" : "s"}`
        : "Delete all queue failed",
    );
    if (response.ok && data.ok) {
      setQueue([]);
      setEditingQueueId(null);
    }
  }

  function askConfirm(
    title: string,
    description: ReactNode,
    onConfirm: () => void,
  ) {
    setConfirmState({
      open: true,
      title,
      description,
      onConfirm,
    });
  }

  function draftDeleteAllDescription(): ReactNode {
    const n = drafts.length;
    if (n === 0) {
      return <>There are no saved drafts to delete.</>;
    }
    const head = drafts.slice(0, 3);
    const rest = n > 3 ? n - 3 : 0;
    return (
      <>
        Permanently delete all{" "}
        <span className="font-semibold text-amber-200/90">{n}</span> saved draft
        {n === 1 ? "" : "s"}
        {": "}
        {head.map((d, i) => {
          const l = d.subject.trim() || "Untitled";
          return (
            <span key={d.id}>
              {i > 0 ? ", " : null}
              <span className="font-semibold text-emerald-200/95">
                &ldquo;{l}&rdquo;
              </span>
            </span>
          );
        })}
        {rest > 0 ? (
          <span className="text-slate-400"> and {rest} more</span>
        ) : null}
        . This cannot be undone.
      </>
    );
  }

  function historyDeleteAllDescription(): ReactNode {
    const n = history.length;
    if (n === 0) {
      return <>There are no resend history entries to delete.</>;
    }
    const head = history.slice(0, 3);
    const rest = n > 3 ? n - 3 : 0;
    return (
      <>
        Permanently delete all{" "}
        <span className="font-semibold text-amber-200/90">{n}</span> resend
        history entr
        {n === 1 ? "y" : "ies"}
        {": "}
        {head.map((h, i) => {
          const l = h.subject.trim() || "Untitled";
          return (
            <span key={h.id}>
              {i > 0 ? ", " : null}
              <span className="font-semibold text-emerald-200/95">
                &ldquo;{l}&rdquo;
              </span>
            </span>
          );
        })}
        {rest > 0 ? (
          <span className="text-slate-400"> and {rest} more</span>
        ) : null}
        . This cannot be undone.
      </>
    );
  }

  function queueDeleteAllDescription(): ReactNode {
    const n = queue.length;
    if (n === 0) {
      return <>There are no scheduled queue entries to delete.</>;
    }
    const head = queue.slice(0, 3);
    const rest = n > 3 ? n - 3 : 0;
    return (
      <>
        Permanently remove all{" "}
        <span className="font-semibold text-amber-200/90">{n}</span> scheduled
        entr
        {n === 1 ? "y" : "ies"}
        {": "}
        {head.map((q, i) => {
          const l = q.subject.trim() || "Untitled";
          return (
            <span key={q.id}>
              {i > 0 ? ", " : null}
              <span className="font-semibold text-emerald-200/95">
                &ldquo;{l}&rdquo;
              </span>
            </span>
          );
        })}
        {rest > 0 ? (
          <span className="text-slate-400"> and {rest} more</span>
        ) : null}
        . This does not send emails.
      </>
    );
  }

  return (
    <>
      <div
        ref={composerCardRef}
        className="scroll-mt-28"
        id="newsletter-post-composer"
      >
        <Card className="glass-panel border-white/15 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-cyan-200" />
            <h2 className="text-lg font-semibold text-white">
              Newsletter Post Composer
            </h2>
          </div>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              Create announcements, offers, and product updates for all active
              subscribers.
            </p>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <RippleButton
                type="button"
                onClick={() => setAiAssistOpen(true)}
                className="rounded-lg border border-violet-300/35 bg-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-100"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI draft helper
                </span>
              </RippleButton>
              {hasComposerContent ? (
                <button
                  type="button"
                  className="text-xs font-medium text-rose-300/90  hover:text-rose-200"
                  onClick={clearComposerForm}
                >
                  Clear form
                </button>
              ) : null}
              {editingDraftId || editingQueueId ? (
                <button
                  type="button"
                  className="text-xs font-medium text-slate-300  hover:text-slate-100"
                  onClick={cancelComposerEdit}
                >
                  Cancel update
                </button>
              ) : null}
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              value={form.subject}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subject: event.target.value }))
              }
              placeholder="Subject (e.g. Spring Offer - 30% Off)"
              className="border-white/15 bg-slate-900/50 text-slate-100"
              required
            />
            <Input
              value={form.preheader}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, preheader: event.target.value }))
              }
              placeholder="Preheader (short summary shown in inbox)"
              className="border-white/15 bg-slate-900/50 text-slate-100"
              required
            />
            <textarea
              value={form.body}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, body: event.target.value }))
              }
              placeholder="Write your message. Use line breaks for paragraphs."
              className="min-h-36 w-full rounded-md border border-white/15 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none ring-offset-2 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={form.ctaLabel}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))
                }
                placeholder="CTA label (optional)"
                className="border-white/15 bg-slate-900/50 text-slate-100"
              />
              <Input
                value={form.ctaUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, ctaUrl: event.target.value }))
                }
                placeholder="CTA URL (optional, https://...)"
                className="border-white/15 bg-slate-900/50 text-slate-100"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-300">
                  Audience
                </label>
                <select
                  value={form.audience}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      audience: event.target.value as BroadcastAudience,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-white/15 bg-slate-900/50 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="all">All active subscribers</option>
                  <option value="recent">Only recent confirms (14 days)</option>
                  <option value="engaged">Only engaged (30 days)</option>
                </select>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-300">
                  Scheduled send time (optional)
                </label>
                <Input
                  type="datetime-local"
                  min={editingQueueId ? undefined : minScheduleLocal}
                  value={scheduledFor}
                  onChange={(event) => setScheduledFor(event.target.value)}
                  className="w-full border-white/15 bg-slate-900/50 text-slate-100"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
                placeholder="Test email (you@example.com)"
                className="border-white/15 bg-slate-900/50 text-slate-100"
              />
              <RippleButton
                type="button"
                disabled={isSending}
                onClick={() => void sendTest()}
                className="rounded-lg border border-cyan-300/30 bg-cyan-500/75 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                Send test email to myself
              </RippleButton>
            </div>
            <div
              className={`grid gap-3 ${editingQueueId ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}
            >
              {!editingQueueId ? (
                <RippleButton
                  type="button"
                  onClick={() => void saveDraft()}
                  className="rounded-lg border border-violet-300/30 bg-violet-500/70 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {editingDraftId ? (
                    <SaveAll className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <Save className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {editingDraftId ? "Save draft (overwrite)" : "Save draft"}
                </RippleButton>
              ) : null}
              <RippleButton
                type="submit"
                disabled={isSending}
                className="rounded-lg border border-emerald-300/30 bg-emerald-500/85 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isSending ? (
                  <>
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin"
                      aria-hidden
                    />
                    {editingQueueId
                      ? "Updating queue…"
                      : editingDraftId
                        ? "Updating…"
                        : "Sending post..."}
                  </>
                ) : editingQueueId ? (
                  <>
                    <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
                    Update queued send
                  </>
                ) : editingDraftId ? (
                  <>
                    <FilePenLine className="h-4 w-4 shrink-0" aria-hidden />
                    Update draft
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 shrink-0" aria-hidden />
                    Send Post to Subscribers
                  </>
                )}
              </RippleButton>
            </div>
          </form>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-100">
                    Saved Drafts
                  </h3>
                  <Badge className="border border-violet-300/35 bg-violet-500/20 text-violet-100">
                    {drafts.length}
                  </Badge>
                </div>
                <button
                  type="button"
                  disabled={drafts.length === 0}
                  className="text-xs font-medium text-rose-300  hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() =>
                    askConfirm(
                      "Delete all drafts",
                      draftDeleteAllDescription(),
                      () => {
                        void deleteAllDrafts();
                      },
                    )
                  }
                >
                  Delete all
                </button>
              </div>
              <div className="space-y-2">
                {drafts.length === 0 ? (
                  <p className="text-sm text-slate-400">No drafts yet.</p>
                ) : (
                  <ScrollPanel className="max-h-[min(28rem,50vh)]">
                    <div className="space-y-2">
                      {drafts.map((item) => (
                        <div
                          key={item.id}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3"
                        >
                          <p className="text-sm font-medium text-slate-100">
                            {item.subject}
                          </p>
                          <p className="text-xs text-slate-400">
                            {item.preheader}
                          </p>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                            <button
                              type="button"
                              onClick={() => void resendFrom(item.id, "draft")}
                              className="shrink-0 text-left text-xs font-medium text-cyan-200 hover:text-cyan-100"
                            >
                              Send this draft now
                            </button>
                            <div className="min-w-0 flex-1 text-center text-xs leading-snug text-slate-400 sm:px-1">
                              <div>
                                Created {formatAdminDateTime(item.createdAt)}
                              </div>
                              {item.updatedAt ? (
                                <div>
                                  Updated {formatAdminDateTime(item.updatedAt)}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center justify-end gap-2">
                              <button
                                type="button"
                                className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-slate-100"
                                aria-label="View draft details"
                                onClick={() =>
                                  setViewDetail({
                                    open: true,
                                    kind: "draft",
                                    item,
                                  })
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-cyan-200"
                                aria-label="Edit draft"
                                onClick={() => loadDraftToEditor(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-rose-200"
                                aria-label="Delete draft"
                                onClick={() => {
                                  const label =
                                    item.subject.trim() || "Untitled";
                                  askConfirm(
                                    "Delete draft",
                                    <>
                                      Are you sure you want to delete this{" "}
                                      <span className="font-semibold text-emerald-200/95">
                                        &ldquo;{label}&rdquo;
                                      </span>{" "}
                                      draft?
                                    </>,
                                    () => {
                                      void deleteDraft(item.id);
                                    },
                                  );
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollPanel>
                )}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-100">
                    Resend History
                  </h3>
                  <Badge className="border border-cyan-300/35 bg-cyan-500/20 text-cyan-100">
                    {history.length}
                  </Badge>
                </div>
                <button
                  type="button"
                  disabled={history.length === 0}
                  className="text-xs font-medium text-rose-300  hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() =>
                    askConfirm(
                      "Delete all history",
                      historyDeleteAllDescription(),
                      () => {
                        void deleteAllHistory();
                      },
                    )
                  }
                >
                  Delete all
                </button>
              </div>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400">No send history yet.</p>
                ) : (
                  <ScrollPanel className="max-h-[min(28rem,50vh)]">
                    <div className="space-y-2">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3"
                        >
                          <p className="text-sm font-medium text-slate-100">
                            {item.subject}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                            <span>Sent: {item.sentCount}</span>
                            <span className="text-right text-xs text-slate-500">
                              Created {formatAdminDateTime(item.createdAt)} ·
                              Sent {formatAdminDateTime(item.sentAt)}
                            </span>
                          </p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void resendFrom(item.id, "history")
                              }
                              className="text-xs font-medium text-emerald-200 hover:text-emerald-100"
                            >
                              Resend this campaign
                            </button>
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-slate-100"
                                aria-label="View history details"
                                onClick={() =>
                                  setViewDetail({
                                    open: true,
                                    kind: "history",
                                    item,
                                  })
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-rose-200"
                                aria-label="Delete history"
                                onClick={() => {
                                  const label =
                                    item.subject.trim() || "Untitled";
                                  askConfirm(
                                    "Delete history item",
                                    <>
                                      Are you sure you want to delete this{" "}
                                      <span className="font-semibold text-emerald-200/95">
                                        &ldquo;{label}&rdquo;
                                      </span>{" "}
                                      resend history entry?
                                    </>,
                                    () => {
                                      void deleteHistoryItem(item.id);
                                    },
                                  );
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollPanel>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-100">
                Scheduled Queue
              </h3>
              <Badge className="border border-amber-300/35 bg-amber-500/20 text-amber-100">
                {queue.length}
              </Badge>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-slate-400">
              &ldquo;Process scheduled queue&rdquo; sends only campaigns whose
              scheduled time is{" "}
              <span className="text-slate-300">already due</span> (past or now).
              It does <span className="text-slate-300">not</span> send
              future-scheduled posts early—edit the row to move the time sooner,
              then process again after that time.
            </p>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <RippleButton
                type="button"
                onClick={() => void runQueueNow()}
                className="rounded-lg border border-amber-300/30 bg-amber-500/75 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
              >
                <PlayCircle className="h-4 w-4 shrink-0" aria-hidden />
                Process scheduled queue now
              </RippleButton>
              <button
                type="button"
                disabled={queue.length === 0}
                className="text-xs font-medium text-rose-300  hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40 sm:text-right"
                onClick={() =>
                  askConfirm(
                    "Delete all queue items",
                    queueDeleteAllDescription(),
                    () => {
                      void deleteAllQueue();
                    },
                  )
                }
              >
                Delete all
              </button>
            </div>
            <div className="space-y-2">
              {queue.length === 0 ? (
                <p className="text-sm text-slate-400">No queued campaigns.</p>
              ) : (
                <ScrollPanel className="max-h-[min(28rem,50vh)]">
                  <div className="space-y-2">
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3"
                      >
                        <p className="text-sm font-medium text-slate-100">
                          {item.subject}
                        </p>
                        {item.preheader?.trim() ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-400">
                            {item.preheader.trim()}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-1">
                          <p className="min-w-0 text-xs leading-snug text-slate-400 sm:max-w-[min(100%,22rem)] sm:flex-1">
                            Schedule: {formatAdminDateTime(item.scheduledFor)} ·
                            Status:{" "}
                            <span
                              className={queueStatusValueClassName(item.status)}
                            >
                              {item.status}
                            </span>
                          </p>
                          <p className="text-xs leading-snug text-slate-500 sm:shrink-0 sm:text-center">
                            Created {formatAdminDateTime(item.createdAt)}
                          </p>
                          <div className="flex shrink-0 items-center justify-start gap-2 sm:ml-auto sm:justify-end">
                            <button
                              type="button"
                              className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-slate-100"
                              aria-label="View queue item details"
                              onClick={() =>
                                setViewDetail({
                                  open: true,
                                  kind: "queue",
                                  item,
                                })
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {item.status === "queued" ? (
                              <button
                                type="button"
                                className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-cyan-200"
                                aria-label="Edit queued send"
                                onClick={() => loadQueueToEditor(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-rose-200"
                              aria-label="Remove from queue"
                              onClick={() => {
                                const label = item.subject.trim() || "Untitled";
                                askConfirm(
                                  "Remove queue item",
                                  <>
                                    Remove &ldquo;
                                    <span className="font-semibold text-emerald-200/95">
                                      {label}
                                    </span>
                                    &rdquo; from the scheduled queue? This does
                                    not send the email.
                                  </>,
                                  () => {
                                    void deleteQueueItem(item.id);
                                  },
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {item.updatedAt ||
                        item.processedAt ||
                        (item.status === "sent" && item.sentCount != null) ||
                        (item.status === "failed" && item.errorMessage) ? (
                          <div className="mt-2 border-t border-white/5 pt-2 text-xs leading-snug text-slate-500">
                            {item.updatedAt ? (
                              <div>
                                Updated {formatAdminDateTime(item.updatedAt)}
                              </div>
                            ) : null}
                            {item.processedAt ? (
                              <div>
                                Processed{" "}
                                {formatAdminDateTime(item.processedAt)}
                              </div>
                            ) : null}
                            {item.status === "sent" &&
                            item.sentCount != null ? (
                              <div>Recipients {item.sentCount}</div>
                            ) : null}
                            {item.status === "failed" && item.errorMessage ? (
                              <div className="text-rose-300/90">
                                Error: {item.errorMessage}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </ScrollPanel>
              )}
            </div>
          </div>
        </Card>
      </div>
      <AlertDialog open={aiAssistOpen}>
        <AlertDialogOverlay />
        <AlertDialogContent className="glass-panel border-violet-400/30 left-1/2 top-1/2 flex h-[80vh] w-[80vw] max-h-[80vh] max-w-[80vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden p-0 sm:h-[80vh] sm:max-h-[80vh] sm:max-w-[80vw] sm:w-[80vw]">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 sm:px-8 py-4 sm:py-6">
            <div className="min-w-0 flex-1 pr-2">
              <h2 className="text-xl sm:text-2xl font-bold leading-tight text-white font-heading">
                AI draft helper
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                Guided assist — review before send
              </p>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
            <p className="text-sm leading-relaxed text-slate-300">
              Describe the announcement (tone, offer, dates). The server fills{" "}
              <span className="font-medium text-slate-200">subject</span>,{" "}
              <span className="font-medium text-slate-200">preheader</span>, and{" "}
              <span className="font-medium text-slate-200">body</span> only—you
              still review, then save a draft or send to subscribers.
            </p>
            <div className="space-y-2">
              <label
                htmlFor="ai-draft-brief"
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                <Sparkles
                  className="h-3.5 w-3.5 text-violet-300/90"
                  aria-hidden
                />
                Your announcement brief
              </label>
              <textarea
                id="ai-draft-brief"
                value={aiBrief}
                onChange={(e) => setAiBrief(e.target.value)}
                rows={8}
                placeholder="e.g. 20% off spring cocktails this weekend, friendly tone…"
                className="min-h-[12rem] w-full resize-y rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/10 px-4 sm:px-8 py-4 sm:py-6">
            <RippleButton
              type="button"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100"
              onClick={() => setAiAssistOpen(false)}
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Close without applying
            </RippleButton>
            <RippleButton
              type="button"
              disabled={aiMutation.isPending}
              className="rounded-lg border border-violet-300/35 bg-violet-500/70 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              onClick={() => aiMutation.mutate(aiBrief)}
            >
              {aiMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin"
                    aria-hidden
                  />
                  Generating draft…
                </span>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 shrink-0" aria-hidden />
                  Fill form automatically
                </>
              )}
            </RippleButton>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {viewDetail.open ? (
        <AlertDialog open className="z-[80]">
          <AlertDialogOverlay className="cursor-default" />
          <AlertDialogContent className="glass-panel left-1/2 top-1/2 h-[80vh] w-[80vw] max-h-[80vh] max-w-[80vw] -translate-x-1/2 -translate-y-1/2 flex flex-col overflow-hidden p-0">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 sm:px-8 py-4 sm:py-6">
              <div className="min-w-0 flex-1 pr-2">
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-white font-heading">
                  {viewDetail.item.subject}
                </h2>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {viewDetail.kind === "draft"
                    ? "Saved draft"
                    : viewDetail.kind === "history"
                      ? "Resend history"
                      : "Scheduled queue"}
                </p>
              </div>
              <RippleButton
                type="button"
                onClick={() => setViewDetail({ open: false })}
                className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100"
              >
                Close
              </RippleButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Preheader
                  </p>
                  <p className="mt-1 text-slate-200">
                    {viewDetail.item.preheader}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Body
                  </p>
                  <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/50 p-3 text-slate-200 whitespace-pre-wrap">
                    {viewDetail.item.body}
                  </div>
                </div>
                {viewDetail.item.ctaLabel?.trim() ||
                viewDetail.item.ctaUrl?.trim() ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Call to action
                    </p>
                    <p className="mt-1 text-slate-200">
                      {viewDetail.item.ctaLabel?.trim() || "—"}
                      {viewDetail.item.ctaUrl?.trim() ? (
                        <>
                          {" "}
                          <span className="text-slate-500">·</span>{" "}
                          <span className="break-all text-cyan-200/90">
                            {viewDetail.item.ctaUrl.trim()}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Audience
                  </p>
                  <p className="mt-1 text-slate-200">
                    {broadcastAudienceLabel(viewDetail.item.audience)}
                  </p>
                </div>
                <div className="border-t border-white/10 pt-3 text-xs text-slate-400">
                  <p>
                    Created {formatAdminDateTime(viewDetail.item.createdAt)}
                  </p>
                  {viewDetail.kind === "draft" && viewDetail.item.updatedAt ? (
                    <p className="mt-1">
                      Updated {formatAdminDateTime(viewDetail.item.updatedAt)}
                    </p>
                  ) : null}
                  {viewDetail.kind === "history" ? (
                    <>
                      <p className="mt-1">
                        Sent {formatAdminDateTime(viewDetail.item.sentAt)} ·
                        Recipients {viewDetail.item.sentCount}
                      </p>
                    </>
                  ) : null}
                  {viewDetail.kind === "queue" ? (
                    <>
                      <p className="mt-1">
                        Scheduled for{" "}
                        {formatAdminDateTime(viewDetail.item.scheduledFor)} ·
                        Status:{" "}
                        <span
                          className={queueStatusValueClassName(
                            viewDetail.item.status,
                          )}
                        >
                          {viewDetail.item.status}
                        </span>
                      </p>
                      {viewDetail.item.updatedAt ? (
                        <p className="mt-1">
                          Updated{" "}
                          {formatAdminDateTime(viewDetail.item.updatedAt)}
                        </p>
                      ) : null}
                      {viewDetail.item.processedAt ? (
                        <p className="mt-1">
                          Processed{" "}
                          {formatAdminDateTime(viewDetail.item.processedAt)}
                        </p>
                      ) : null}
                      {viewDetail.item.status === "sent" &&
                      viewDetail.item.sentCount != null ? (
                        <p className="mt-1">
                          Recipients {viewDetail.item.sentCount}
                        </p>
                      ) : null}
                      {viewDetail.item.status === "failed" &&
                      viewDetail.item.errorMessage ? (
                        <p className="mt-1 text-rose-300/90">
                          Error: {viewDetail.item.errorMessage}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 sm:px-8 py-4 sm:py-6">
              {viewDetail.kind === "draft" ? (
                <>
                  <RippleButton
                    type="button"
                    className="rounded-lg border border-cyan-300/35 bg-cyan-600/75 px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => {
                      void resendFrom(viewDetail.item.id, "draft");
                      setViewDetail({ open: false });
                    }}
                  >
                    Send this draft now
                  </RippleButton>
                  <RippleButton
                    type="button"
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100"
                    onClick={() => {
                      loadDraftToEditor(viewDetail.item);
                      setViewDetail({ open: false });
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Edit in composer
                  </RippleButton>
                  <RippleButton
                    type="button"
                    className="rounded-lg border border-rose-300/30 bg-rose-500/70 px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => {
                      const label =
                        viewDetail.item.subject.trim() || "Untitled";
                      setViewDetail({ open: false });
                      askConfirm(
                        "Delete draft",
                        <>
                          Are you sure you want to delete this{" "}
                          <span className="font-semibold text-emerald-200/95">
                            &ldquo;{label}&rdquo;
                          </span>{" "}
                          draft?
                        </>,
                        () => {
                          void deleteDraft(viewDetail.item.id);
                        },
                      );
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Delete draft
                  </RippleButton>
                </>
              ) : null}
              {viewDetail.kind === "history" ? (
                <>
                  <RippleButton
                    type="button"
                    className="rounded-lg border border-emerald-300/35 bg-emerald-600/75 px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => {
                      void resendFrom(viewDetail.item.id, "history");
                      setViewDetail({ open: false });
                    }}
                  >
                    Resend this campaign
                  </RippleButton>
                  <RippleButton
                    type="button"
                    className="rounded-lg border border-rose-300/30 bg-rose-500/70 px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => {
                      const label =
                        viewDetail.item.subject.trim() || "Untitled";
                      setViewDetail({ open: false });
                      askConfirm(
                        "Delete history item",
                        <>
                          Are you sure you want to delete this{" "}
                          <span className="font-semibold text-emerald-200/95">
                            &ldquo;{label}&rdquo;
                          </span>{" "}
                          resend history entry?
                        </>,
                        () => {
                          void deleteHistoryItem(viewDetail.item.id);
                        },
                      );
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Delete from history
                  </RippleButton>
                </>
              ) : null}
              {viewDetail.kind === "queue" ? (
                <>
                  {viewDetail.item.status === "queued" ? (
                    <RippleButton
                      type="button"
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100"
                      onClick={() => {
                        loadQueueToEditor(viewDetail.item);
                        setViewDetail({ open: false });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Edit in composer
                    </RippleButton>
                  ) : null}
                  <RippleButton
                    type="button"
                    className="rounded-lg border border-rose-300/30 bg-rose-500/70 px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => {
                      const label =
                        viewDetail.item.subject.trim() || "Untitled";
                      setViewDetail({ open: false });
                      askConfirm(
                        "Remove queue item",
                        <>
                          Remove &ldquo;
                          <span className="font-semibold text-emerald-200/95">
                            {label}
                          </span>
                          &rdquo; from the scheduled queue? This does not send
                          the email.
                        </>,
                        () => {
                          void deleteQueueItem(viewDetail.item.id);
                        },
                      );
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Remove from queue
                  </RippleButton>
                </>
              ) : null}
            </div>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      <AlertDialog open={confirmState.open}>
        <AlertDialogOverlay />
        <AlertDialogContent className="glass-panel border-cyan-400/30">
          <AlertDialogHeader>
            <div>
              <AlertDialogTitle>{confirmState.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmState.description}
              </AlertDialogDescription>
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
              Confirm Delete
            </RippleButton>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

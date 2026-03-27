import {
  getActiveSubscriberCount,
  listAllSubscribers,
  listBroadcastDrafts,
  listBroadcastHistory,
  listBroadcastQueue,
  listPendingSubscribers,
} from "@/lib/newsletter/repository";
import type {
  BroadcastDraft,
  BroadcastQueueItem,
  BroadcastHistoryItem,
  NewsletterSubscriber,
  UnsubscribeReason,
} from "@/types/newsletter";

export interface ControlRoomSummary {
  activeCount: number;
  pendingCount: number;
  unsubscribedCount: number;
  confirmedCount: number;
  reasonBreakdown: Array<{ reason: UnsubscribeReason | "unknown"; count: number }>;
  recentConfirmed: NewsletterSubscriber[];
  recentPending: NewsletterSubscriber[];
  setupChecklist: Array<{ label: string; ready: boolean }>;
  recentBroadcasts: BroadcastHistoryItem[];
  recentDrafts: BroadcastDraft[];
  recentQueue: BroadcastQueueItem[];
}

export async function getControlRoomSummary(): Promise<ControlRoomSummary> {
  const [
    activeCount,
    allSubscribers,
    pendingSubscribers,
    recentBroadcasts,
    recentDrafts,
    recentQueue,
  ] =
    await Promise.all([
    getActiveSubscriberCount(),
    listAllSubscribers(),
    listPendingSubscribers(),
    listBroadcastHistory(),
    listBroadcastDrafts(),
      listBroadcastQueue(),
  ]);

  const unsubscribed = allSubscribers.filter((item) => Boolean(item.unsubscribedAt));
  const confirmed = allSubscribers.filter((item) => Boolean(item.confirmedAt));
  const reasonMap = new Map<UnsubscribeReason | "unknown", number>();

  for (const subscriber of unsubscribed) {
    const reason = subscriber.unsubscribeReason ?? "unknown";
    reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
  }

  const reasonBreakdown = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const setupChecklist = [
    { label: "Resend configured", ready: Boolean(process.env.RESEND_API_KEY) },
    { label: "Sender email configured", ready: Boolean(process.env.RESEND_FROM_EMAIL) },
    { label: "Upstash configured", ready: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) },
    { label: "App URL configured", ready: Boolean(process.env.NEXT_PUBLIC_APP_URL) },
    { label: "Unsubscribe signing key configured", ready: Boolean(process.env.NEWSLETTER_UNSUBSCRIBE_SECRET) },
    { label: "Confirm signing key configured", ready: Boolean(process.env.NEWSLETTER_CONFIRM_SECRET ?? process.env.NEWSLETTER_UNSUBSCRIBE_SECRET) },
  ];

  return {
    activeCount,
    pendingCount: pendingSubscribers.length,
    unsubscribedCount: unsubscribed.length,
    confirmedCount: confirmed.length,
    reasonBreakdown,
    recentConfirmed: confirmed.slice(0, 8),
    recentPending: pendingSubscribers.slice(0, 8),
    setupChecklist,
    recentBroadcasts: recentBroadcasts.slice(0, 8),
    recentDrafts: recentDrafts.slice(0, 8),
    recentQueue: recentQueue.slice(0, 8),
  };
}

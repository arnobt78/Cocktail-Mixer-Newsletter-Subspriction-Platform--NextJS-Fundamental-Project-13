export interface NewsletterSubscribeRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface NewsletterSubscriber {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
  unsubscribedAt?: string;
  unsubscribeReason?: UnsubscribeReason;
  unsubscribeFeedback?: string;
  confirmedAt?: string;
}

export interface NewsletterApiResponse {
  ok: boolean;
  message: string;
}

export type UnsubscribeReason =
  | "too_many_emails"
  | "not_relevant"
  | "signed_up_by_mistake"
  | "prefer_another_channel"
  | "other";

export type BroadcastAudience = "all" | "recent" | "engaged";

export interface BroadcastDraft {
  id: string;
  subject: string;
  preheader: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  audience: BroadcastAudience;
  createdAt: string;
}

export interface BroadcastHistoryItem extends BroadcastDraft {
  sentCount: number;
  sentAt: string;
}

export interface BroadcastQueueItem extends BroadcastDraft {
  scheduledFor: string;
  status: "queued" | "sent" | "failed";
  processedAt?: string;
  sentCount?: number;
  errorMessage?: string;
}

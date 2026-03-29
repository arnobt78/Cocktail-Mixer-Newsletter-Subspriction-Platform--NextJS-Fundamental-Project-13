/**
 * Persistence layer: Upstash Redis keys for subscribers, pending confirms, broadcast drafts/queue/history, dead-letter.
 */
import { Redis } from "@upstash/redis";
import type {
  BroadcastDraft,
  BroadcastQueueItem,
  BroadcastHistoryItem,
  BroadcastAudience,
  NewsletterSubscriber,
} from "@/types/newsletter";

const EMAIL_SET_KEY = "newsletter:emails";
const SUBSCRIBER_HASH_KEY = "newsletter:subscribers";
const PENDING_HASH_KEY = "newsletter:pending";
const DEAD_LETTER_KEY = "newsletter:dead-letter";
const BROADCAST_DRAFT_KEY = "newsletter:broadcast:drafts";
const BROADCAST_HISTORY_KEY = "newsletter:broadcast:history";
const BROADCAST_QUEUE_KEY = "newsletter:broadcast:queue";

function getRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis is not configured");
  }

  return new Redis({ url, token });
}

function deserializeValue<T>(value: unknown): T | null {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") {
    return value as T;
  }
  return null;
}

function deserializeList<T>(values: unknown[]): T[] {
  return values
    .map((item) => deserializeValue<T>(item))
    .filter((item): item is T => item !== null);
}

export async function isSubscriberExists(email: string): Promise<boolean> {
  const redis = getRedisClient();
  const exists = await redis.sismember(EMAIL_SET_KEY, email.toLowerCase());
  return Boolean(exists);
}

export async function saveSubscriber(
  subscriber: NewsletterSubscriber,
  addToActiveSet = true,
): Promise<void> {
  const redis = getRedisClient();
  const email = subscriber.email.toLowerCase();
  if (addToActiveSet) {
    await redis.sadd(EMAIL_SET_KEY, email);
  }
  await redis.hset(SUBSCRIBER_HASH_KEY, {
    [email]: JSON.stringify(subscriber),
  });
}

export async function getSubscriberByEmail(
  email: string,
): Promise<NewsletterSubscriber | null> {
  const redis = getRedisClient();
  const normalizedEmail = email.toLowerCase();
  const rawValue = await redis.hget(SUBSCRIBER_HASH_KEY, normalizedEmail);
  if (!rawValue) {
    return null;
  }
  return deserializeValue<NewsletterSubscriber>(rawValue);
}

export async function markSubscriberUnsubscribed(email: string): Promise<void> {
  const redis = getRedisClient();
  const normalizedEmail = email.toLowerCase();
  const subscriber = await getSubscriberByEmail(normalizedEmail);
  if (!subscriber) {
    return;
  }

  const next: NewsletterSubscriber = {
    ...subscriber,
    unsubscribedAt: new Date().toISOString(),
  };

  await redis.hset(SUBSCRIBER_HASH_KEY, {
    [normalizedEmail]: JSON.stringify(next),
  });
  await redis.srem(EMAIL_SET_KEY, normalizedEmail);
}

export async function savePendingSubscriber(subscriber: NewsletterSubscriber): Promise<void> {
  const redis = getRedisClient();
  const email = subscriber.email.toLowerCase();
  await redis.hset(PENDING_HASH_KEY, {
    [email]: JSON.stringify(subscriber),
  });
}

export async function getPendingSubscriberByEmail(
  email: string,
): Promise<NewsletterSubscriber | null> {
  const redis = getRedisClient();
  const normalizedEmail = email.toLowerCase();
  const rawValue = await redis.hget(PENDING_HASH_KEY, normalizedEmail);
  if (!rawValue) {
    return null;
  }
  return deserializeValue<NewsletterSubscriber>(rawValue);
}

export async function deletePendingSubscriber(email: string): Promise<void> {
  const redis = getRedisClient();
  await redis.hdel(PENDING_HASH_KEY, email.toLowerCase());
}

export async function listAllSubscribers(): Promise<NewsletterSubscriber[]> {
  const redis = getRedisClient();
  const values = await redis.hgetall<Record<string, unknown>>(SUBSCRIBER_HASH_KEY);
  const serialized = Object.values(values ?? {});
  return deserializeList<NewsletterSubscriber>(serialized).sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  );
}

export async function listPendingSubscribers(): Promise<NewsletterSubscriber[]> {
  const redis = getRedisClient();
  const values = await redis.hgetall<Record<string, unknown>>(PENDING_HASH_KEY);
  const serialized = Object.values(values ?? {});
  return deserializeList<NewsletterSubscriber>(serialized).sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  );
}

export async function getActiveSubscriberCount(): Promise<number> {
  const redis = getRedisClient();
  return redis.scard(EMAIL_SET_KEY);
}

export async function listActiveSubscribers(): Promise<NewsletterSubscriber[]> {
  const all = await listAllSubscribers();
  return all.filter((item) => Boolean(item.confirmedAt) && !item.unsubscribedAt);
}

export async function listAudienceSubscribers(
  audience: BroadcastAudience,
): Promise<NewsletterSubscriber[]> {
  const active = await listActiveSubscribers();
  if (audience === "all") {
    return active;
  }

  const now = Date.now();
  const recentMs = 14 * 24 * 60 * 60 * 1000;
  const engagedMs = 30 * 24 * 60 * 60 * 1000;

  if (audience === "recent") {
    return active.filter((item) => {
      const ts = Date.parse(item.confirmedAt ?? item.createdAt);
      return Number.isFinite(ts) && now - ts <= recentMs;
    });
  }

  return active.filter((item) => {
    const ts = Date.parse(item.confirmedAt ?? item.createdAt);
    return Number.isFinite(ts) && now - ts <= engagedMs;
  });
}

export async function saveDeadLetter(entry: {
  kind: string;
  toEmail: string;
  subject: string;
  error: string;
  payload: Record<string, string>;
}): Promise<void> {
  const redis = getRedisClient();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await redis.hset(DEAD_LETTER_KEY, {
    [id]: JSON.stringify({
      id,
      ...entry,
      createdAt: new Date().toISOString(),
    }),
  });
}

export async function countDeadLetterEntries(): Promise<number> {
  const redis = getRedisClient();
  return redis.hlen(DEAD_LETTER_KEY);
}

export async function saveBroadcastDraft(draft: Omit<BroadcastDraft, "id" | "createdAt">): Promise<BroadcastDraft> {
  const redis = getRedisClient();
  const next: BroadcastDraft = {
    ...draft,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await redis.hset(BROADCAST_DRAFT_KEY, {
    [next.id]: JSON.stringify(next),
  });
  return next;
}

export async function listBroadcastDrafts(): Promise<BroadcastDraft[]> {
  const redis = getRedisClient();
  const values = await redis.hgetall<Record<string, unknown>>(BROADCAST_DRAFT_KEY);
  return deserializeList<BroadcastDraft>(Object.values(values ?? {}))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBroadcastDraftById(id: string): Promise<BroadcastDraft | null> {
  const redis = getRedisClient();
  const raw = await redis.hget(BROADCAST_DRAFT_KEY, id);
  return deserializeValue<BroadcastDraft>(raw);
}

export async function updateBroadcastDraft(
  id: string,
  draft: Omit<BroadcastDraft, "id" | "createdAt">,
): Promise<BroadcastDraft | null> {
  const redis = getRedisClient();
  const existing = await getBroadcastDraftById(id);
  if (!existing) {
    return null;
  }

  const next: BroadcastDraft = {
    ...existing,
    ...draft,
    id,
    updatedAt: new Date().toISOString(),
  };

  await redis.hset(BROADCAST_DRAFT_KEY, {
    [id]: JSON.stringify(next),
  });
  return next;
}

export async function deleteBroadcastDraft(id: string): Promise<void> {
  const redis = getRedisClient();
  await redis.hdel(BROADCAST_DRAFT_KEY, id);
}

export async function clearBroadcastDrafts(): Promise<void> {
  const redis = getRedisClient();
  await redis.del(BROADCAST_DRAFT_KEY);
}

export async function saveBroadcastHistory(item: Omit<BroadcastHistoryItem, "id" | "createdAt" | "sentAt">): Promise<void> {
  const redis = getRedisClient();
  const next: BroadcastHistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
  };
  await redis.hset(BROADCAST_HISTORY_KEY, {
    [next.id]: JSON.stringify(next),
  });
}

export async function listBroadcastHistory(): Promise<BroadcastHistoryItem[]> {
  const redis = getRedisClient();
  const values = await redis.hgetall<Record<string, unknown>>(BROADCAST_HISTORY_KEY);
  return deserializeList<BroadcastHistoryItem>(Object.values(values ?? {}))
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

export async function getBroadcastHistoryById(
  id: string,
): Promise<BroadcastHistoryItem | null> {
  const redis = getRedisClient();
  const raw = await redis.hget(BROADCAST_HISTORY_KEY, id);
  return deserializeValue<BroadcastHistoryItem>(raw);
}

export async function deleteBroadcastHistoryItem(id: string): Promise<void> {
  const redis = getRedisClient();
  await redis.hdel(BROADCAST_HISTORY_KEY, id);
}

export async function clearBroadcastHistory(): Promise<void> {
  const redis = getRedisClient();
  await redis.del(BROADCAST_HISTORY_KEY);
}

export async function saveBroadcastQueueItem(
  item: Omit<BroadcastQueueItem, "id" | "createdAt" | "status">,
): Promise<BroadcastQueueItem> {
  const redis = getRedisClient();
  const next: BroadcastQueueItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: "queued",
  };
  await redis.hset(BROADCAST_QUEUE_KEY, {
    [next.id]: JSON.stringify(next),
  });
  return next;
}

export async function listBroadcastQueue(): Promise<BroadcastQueueItem[]> {
  const redis = getRedisClient();
  const values = await redis.hgetall<Record<string, unknown>>(BROADCAST_QUEUE_KEY);
  return deserializeList<BroadcastQueueItem>(Object.values(values ?? {}))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listDueBroadcastQueueItems(nowIso: string): Promise<BroadcastQueueItem[]> {
  const all = await listBroadcastQueue();
  return all.filter(
    (item) => item.status === "queued" && item.scheduledFor <= nowIso,
  );
}

export async function getBroadcastQueueItemById(id: string): Promise<BroadcastQueueItem | null> {
  const redis = getRedisClient();
  const raw = await redis.hget(BROADCAST_QUEUE_KEY, id);
  return deserializeValue<BroadcastQueueItem>(raw);
}

export async function updateBroadcastQueueItem(item: BroadcastQueueItem): Promise<void> {
  const redis = getRedisClient();
  const next: BroadcastQueueItem = {
    ...item,
    updatedAt: new Date().toISOString(),
  };
  await redis.hset(BROADCAST_QUEUE_KEY, {
    [item.id]: JSON.stringify(next),
  });
}

export async function deleteBroadcastQueueItem(id: string): Promise<void> {
  const redis = getRedisClient();
  await redis.hdel(BROADCAST_QUEUE_KEY, id);
}

export async function clearBroadcastQueue(): Promise<void> {
  const redis = getRedisClient();
  await redis.del(BROADCAST_QUEUE_KEY);
}

export async function adminDeleteSubscriberRecord(email: string): Promise<void> {
  const redis = getRedisClient();
  const normalized = email.toLowerCase();
  await redis.hdel(SUBSCRIBER_HASH_KEY, normalized);
  await redis.srem(EMAIL_SET_KEY, normalized);
}

export async function adminUpdateSubscriberNames(
  email: string,
  firstName: string,
  lastName: string,
): Promise<NewsletterSubscriber | null> {
  const existing = await getSubscriberByEmail(email);
  if (!existing) {
    return null;
  }
  const fn = firstName.trim();
  const ln = lastName.trim();
  const next: NewsletterSubscriber = {
    ...existing,
    firstName: fn,
    lastName: ln,
    fullName: [fn, ln].filter(Boolean).join(" ") || existing.email,
  };
  await saveSubscriber(next, false);
  return next;
}

export async function adminUpdatePendingSubscriberNames(
  email: string,
  firstName: string,
  lastName: string,
): Promise<NewsletterSubscriber | null> {
  const redis = getRedisClient();
  const normalized = email.toLowerCase();
  const existing = await getPendingSubscriberByEmail(normalized);
  if (!existing) {
    return null;
  }
  const fn = firstName.trim();
  const ln = lastName.trim();
  const next: NewsletterSubscriber = {
    ...existing,
    firstName: fn,
    lastName: ln,
    fullName: [fn, ln].filter(Boolean).join(" ") || existing.email,
  };
  await redis.hset(PENDING_HASH_KEY, {
    [normalized]: JSON.stringify(next),
  });
  return next;
}

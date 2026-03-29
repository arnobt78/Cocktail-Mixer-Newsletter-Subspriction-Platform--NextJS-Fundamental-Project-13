/** Fan-out broadcast to audience segments; per-recipient unsubscribe URLs signed with shared secret. */
import { sendBroadcastEmail } from "@/lib/newsletter/mailer";
import { createUnsubscribeToken } from "@/lib/newsletter/security";
import {
  listAudienceSubscribers,
  saveBroadcastHistory,
} from "@/lib/newsletter/repository";
import type { BroadcastAudience } from "@/types/newsletter";

interface DispatchPayload {
  subject: string;
  preheader: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  audience: BroadcastAudience;
}

export async function dispatchBroadcast(
  payload: DispatchPayload,
): Promise<{ sent: number }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }

  const subscribers = await listAudienceSubscribers(payload.audience);
  const results = await Promise.allSettled(
    subscribers.map(async (subscriber) => {
      const token = createUnsubscribeToken(subscriber.email);
      const unsubscribeUrl = `${appUrl.replace(/\/$/, "")}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${encodeURIComponent(token)}`;
      await sendBroadcastEmail({
        toEmail: subscriber.email,
        fullName: subscriber.fullName,
        subject: payload.subject,
        preheader: payload.preheader,
        body: payload.body,
        ctaLabel: payload.ctaLabel,
        ctaUrl: payload.ctaUrl,
        unsubscribeUrl,
      });
    }),
  );

  const sent = results.filter((item) => item.status === "fulfilled").length;
  await saveBroadcastHistory({
    subject: payload.subject,
    preheader: payload.preheader,
    body: payload.body,
    ctaLabel: payload.ctaLabel,
    ctaUrl: payload.ctaUrl,
    audience: payload.audience,
    sentCount: sent,
  });

  return { sent };
}

/** Send now, test to one inbox, or enqueue for scheduled delivery; uses mailer + dispatch helpers. */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";
import { sendBroadcastEmail } from "@/lib/newsletter/mailer";
import {
  saveBroadcastQueueItem,
} from "@/lib/newsletter/repository";
import { dispatchBroadcast } from "@/lib/newsletter/broadcast-dispatch";
import { createUnsubscribeToken } from "@/lib/newsletter/security";
import type { BroadcastAudience, BroadcastQueueItem } from "@/types/newsletter";

interface BroadcastPayload {
  subject: string;
  preheader: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  audience?: BroadcastAudience;
  mode?: "bulk" | "test";
  testEmail?: string;
  scheduledFor?: string;
}

export async function POST(
  request: Request,
): Promise<NextResponse<{ ok: boolean; message: string; sent?: number; queueItem?: BroadcastQueueItem }>> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!verifyAdminSessionValue(sessionValue)) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as BroadcastPayload;
  if (!payload.subject?.trim() || !payload.preheader?.trim() || !payload.body?.trim()) {
    return NextResponse.json(
      { ok: false, message: "Subject, preheader, and body are required." },
      { status: 400 },
    );
  }

  if (payload.ctaUrl && !/^https?:\/\//.test(payload.ctaUrl)) {
    return NextResponse.json(
      { ok: false, message: "CTA URL must be a valid http(s) URL." },
      { status: 400 },
    );
  }
  const audience: BroadcastAudience = payload.audience ?? "all";
  const mode = payload.mode ?? "bulk";
  const cleanPayload = {
    subject: payload.subject.trim(),
    preheader: payload.preheader.trim(),
    body: payload.body.trim(),
    ctaLabel: payload.ctaLabel?.trim() || undefined,
    ctaUrl: payload.ctaUrl?.trim() || undefined,
    audience,
  };

  if (mode === "bulk" && payload.scheduledFor) {
    const scheduleDate = new Date(payload.scheduledFor);
    if (Number.isNaN(scheduleDate.getTime()) || scheduleDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { ok: false, message: "Scheduled time must be in the future." },
        { status: 400 },
      );
    }
    const queueItem = await saveBroadcastQueueItem({
      ...cleanPayload,
      scheduledFor: scheduleDate.toISOString(),
    });
    return NextResponse.json({
      ok: true,
      message: "Post queued for scheduled delivery.",
      sent: 0,
      queueItem,
    });
  }

  let sent = 0;
  if (mode === "test") {
    const testEmail = payload.testEmail?.trim().toLowerCase();
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      return NextResponse.json(
        { ok: false, message: "Valid test email is required for test mode." },
        { status: 400 },
      );
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { ok: false, message: "NEXT_PUBLIC_APP_URL is not configured." },
        { status: 500 },
      );
    }
    const token = createUnsubscribeToken(testEmail);
    const unsubscribeUrl = `${appUrl.replace(/\/$/, "")}/newsletter/unsubscribe?email=${encodeURIComponent(testEmail)}&token=${encodeURIComponent(token)}`;
    await sendBroadcastEmail({
      toEmail: testEmail,
      fullName: "Admin Test",
      subject: cleanPayload.subject,
      preheader: cleanPayload.preheader,
      body: cleanPayload.body,
      ctaLabel: cleanPayload.ctaLabel,
      ctaUrl: cleanPayload.ctaUrl,
      unsubscribeUrl,
    });
    sent = 1;
  } else {
    sent = (await dispatchBroadcast(cleanPayload)).sent;
  }
  return NextResponse.json({
    ok: true,
    message:
      mode === "test"
        ? "Test email delivered."
        : `Post sent to ${sent} subscribers.`,
    sent,
  });
}

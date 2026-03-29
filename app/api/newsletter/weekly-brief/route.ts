/** Cron-only digest: requires x-cron-secret; not for browsers. Sends batch email to active list. */
import { NextResponse } from "next/server";
import { listActiveSubscribers } from "@/lib/newsletter/repository";
import { createUnsubscribeToken } from "@/lib/newsletter/security";
import { sendDigestEmail } from "@/lib/newsletter/mailer";

export async function POST(request: Request): Promise<NextResponse<{ ok: boolean; message: string; sent?: number }>> {
  const cronSecret = process.env.CRON_DIGEST_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, message: "CRON_DIGEST_SECRET is not configured." },
      { status: 500 },
    );
  }

  const requestSecret = request.headers.get("x-cron-secret") ?? "";
  if (requestSecret !== cronSecret) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { ok: false, message: "NEXT_PUBLIC_APP_URL is not configured." },
      { status: 500 },
    );
  }

  const activeSubscribers = await listActiveSubscribers();
  const weekLabel = new Date().toISOString().slice(0, 10);

  const results = await Promise.allSettled(
    activeSubscribers.map(async (subscriber) => {
      const token = createUnsubscribeToken(subscriber.email);
      const unsubscribeUrl = `${appUrl.replace(/\/$/, "")}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${encodeURIComponent(token)}`;
      await sendDigestEmail({
        toEmail: subscriber.email,
        fullName: subscriber.fullName,
        weekLabel,
        unsubscribeUrl,
      });
    }),
  );

  const sent = results.filter((item) => item.status === "fulfilled").length;
  return NextResponse.json({
    ok: true,
    message: "Weekly brief run completed.",
    sent,
  });
}

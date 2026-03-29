/** Worker-style POST: sends due queue items whose schedule ≤ now. */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dispatchBroadcast } from "@/lib/newsletter/broadcast-dispatch";
import {
  listDueBroadcastQueueItems,
  updateBroadcastQueueItem,
} from "@/lib/newsletter/repository";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";

export async function POST(request: Request): Promise<NextResponse<{ ok: boolean; message: string; processed: number }>> {
  const secret = process.env.CRON_DIGEST_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "CRON_DIGEST_SECRET is not configured.", processed: 0 },
      { status: 500 },
    );
  }

  const provided = request.headers.get("x-cron-secret") ?? "";
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  const hasAdminSession = verifyAdminSessionValue(sessionValue);
  if (provided !== secret && !hasAdminSession) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized.", processed: 0 },
      { status: 401 },
    );
  }

  const nowIso = new Date().toISOString();
  const due = await listDueBroadcastQueueItems(nowIso);
  let processed = 0;

  for (const item of due) {
    try {
      const result = await dispatchBroadcast({
        subject: item.subject,
        preheader: item.preheader,
        body: item.body,
        ctaLabel: item.ctaLabel,
        ctaUrl: item.ctaUrl,
        audience: item.audience,
      });
      await updateBroadcastQueueItem({
        ...item,
        status: "sent",
        processedAt: new Date().toISOString(),
        sentCount: result.sent,
        errorMessage: undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Queue send failed";
      await updateBroadcastQueueItem({
        ...item,
        status: "failed",
        processedAt: new Date().toISOString(),
        errorMessage: message,
      });
    }
    processed += 1;
  }

  return NextResponse.json({
    ok: true,
    message: "Queue processing complete.",
    processed,
  });
}

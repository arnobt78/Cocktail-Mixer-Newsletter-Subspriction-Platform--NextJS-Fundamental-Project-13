/** Scheduled broadcast queue: GET list, PATCH item, DELETE one or all (cookie auth via ensureAuth). */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";
import {
  deleteBroadcastQueueItem,
  clearBroadcastQueue,
  getBroadcastQueueItemById,
  listBroadcastQueue,
  updateBroadcastQueueItem,
} from "@/lib/newsletter/repository";
import type { BroadcastAudience, BroadcastQueueItem } from "@/types/newsletter";

async function ensureAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  return verifyAdminSessionValue(sessionValue);
}

export async function GET(): Promise<
  NextResponse<{ ok: boolean; items?: BroadcastQueueItem[]; message?: string }>
> {
  if (!(await ensureAuth())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  const items = await listBroadcastQueue();
  return NextResponse.json({ ok: true, items });
}

export async function PATCH(
  request: Request,
): Promise<NextResponse<{ ok: boolean; message: string }>> {
  if (!(await ensureAuth())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    id?: string;
    subject?: string;
    preheader?: string;
    body?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    audience?: BroadcastAudience;
    scheduledFor?: string;
  };

  if (!payload.id?.trim()) {
    return NextResponse.json({ ok: false, message: "Queue item id is required." }, { status: 400 });
  }
  if (!payload.subject?.trim() || !payload.preheader?.trim() || !payload.body?.trim()) {
    return NextResponse.json(
      { ok: false, message: "Subject, preheader, and body are required." },
      { status: 400 },
    );
  }
  if (!payload.scheduledFor?.trim()) {
    return NextResponse.json(
      { ok: false, message: "Scheduled time is required for queued campaigns." },
      { status: 400 },
    );
  }

  const scheduleDate = new Date(payload.scheduledFor);
  if (Number.isNaN(scheduleDate.getTime()) || scheduleDate.getTime() <= Date.now()) {
    return NextResponse.json(
      { ok: false, message: "Scheduled time must be in the future." },
      { status: 400 },
    );
  }

  const existing = await getBroadcastQueueItemById(payload.id.trim());
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Queue item not found." }, { status: 404 });
  }
  if (existing.status !== "queued") {
    return NextResponse.json(
      { ok: false, message: "Only queued items can be edited." },
      { status: 400 },
    );
  }

  const next = {
    ...existing,
    subject: payload.subject.trim(),
    preheader: payload.preheader.trim(),
    body: payload.body.trim(),
    ctaLabel: payload.ctaLabel?.trim() || undefined,
    ctaUrl: payload.ctaUrl?.trim() || undefined,
    audience: payload.audience ?? "all",
    scheduledFor: scheduleDate.toISOString(),
  };

  await updateBroadcastQueueItem(next);

  const saved = await getBroadcastQueueItemById(payload.id.trim());
  return NextResponse.json(
    { ok: true, message: "Queued campaign updated.", item: saved ?? next },
    { status: 200 },
  );
}

export async function DELETE(request: Request): Promise<NextResponse<{ ok: boolean; message: string }>> {
  if (!(await ensureAuth())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    await deleteBroadcastQueueItem(id);
    return NextResponse.json({ ok: true, message: "Queue item removed." }, { status: 200 });
  }

  await clearBroadcastQueue();
  return NextResponse.json({ ok: true, message: "All queue items removed." }, { status: 200 });
}

/** Composer drafts: PATCH fields or DELETE one / all. */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";
import {
  clearBroadcastDrafts,
  deleteBroadcastDraft,
  updateBroadcastDraft,
} from "@/lib/newsletter/repository";
import type { BroadcastAudience, BroadcastDraft } from "@/types/newsletter";

async function ensureAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  return verifyAdminSessionValue(sessionValue);
}

export async function PATCH(
  request: Request,
): Promise<NextResponse<{ ok: boolean; message: string; draft?: BroadcastDraft }>> {
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
  };
  if (!payload.id?.trim()) {
    return NextResponse.json({ ok: false, message: "Draft id is required." }, { status: 400 });
  }
  if (!payload.subject?.trim() || !payload.preheader?.trim() || !payload.body?.trim()) {
    return NextResponse.json(
      { ok: false, message: "Subject, preheader, and body are required." },
      { status: 400 },
    );
  }

  const updated = await updateBroadcastDraft(payload.id.trim(), {
    subject: payload.subject.trim(),
    preheader: payload.preheader.trim(),
    body: payload.body.trim(),
    ctaLabel: payload.ctaLabel?.trim() || undefined,
    ctaUrl: payload.ctaUrl?.trim() || undefined,
    audience: payload.audience ?? "all",
  });

  if (!updated) {
    return NextResponse.json({ ok: false, message: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: "Draft updated.", draft: updated }, { status: 200 });
}

export async function DELETE(request: Request): Promise<NextResponse<{ ok: boolean; message: string }>> {
  if (!(await ensureAuth())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    await deleteBroadcastDraft(id);
    return NextResponse.json({ ok: true, message: "Draft deleted." }, { status: 200 });
  }

  await clearBroadcastDrafts();
  return NextResponse.json({ ok: true, message: "All drafts deleted." }, { status: 200 });
}

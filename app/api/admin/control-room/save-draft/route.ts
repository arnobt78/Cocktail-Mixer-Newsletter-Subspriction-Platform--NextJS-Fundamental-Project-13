/** Upsert a draft record from the composer form JSON. */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";
import { saveBroadcastDraft } from "@/lib/newsletter/repository";
import type { BroadcastAudience, BroadcastDraft } from "@/types/newsletter";

export async function POST(
  request: Request,
): Promise<NextResponse<{ ok: boolean; message: string; draft?: BroadcastDraft }>> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!verifyAdminSessionValue(sessionValue)) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    subject?: string;
    preheader?: string;
    body?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    audience?: BroadcastAudience;
  };

  if (!payload.subject?.trim() || !payload.preheader?.trim() || !payload.body?.trim()) {
    return NextResponse.json(
      { ok: false, message: "Subject, preheader, and body are required." },
      { status: 400 },
    );
  }

  const draft = await saveBroadcastDraft({
    subject: payload.subject.trim(),
    preheader: payload.preheader.trim(),
    body: payload.body.trim(),
    ctaLabel: payload.ctaLabel?.trim() || undefined,
    ctaUrl: payload.ctaUrl?.trim() || undefined,
    audience: payload.audience ?? "all",
  });

  return NextResponse.json({ ok: true, message: "Draft saved.", draft }, { status: 200 });
}

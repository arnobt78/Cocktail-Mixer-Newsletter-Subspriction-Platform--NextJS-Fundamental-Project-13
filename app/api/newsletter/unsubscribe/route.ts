/** One-click unsubscribe: validates token, records reason/feedback optional, sets unsubscribedAt. */
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/newsletter/rate-limit";
import { unsubscribeFromNewsletter } from "@/lib/newsletter/service";
import type { NewsletterApiResponse } from "@/types/newsletter";

export async function POST(request: Request): Promise<NextResponse<NewsletterApiResponse>> {
  try {
    const rateLimit = await applyRateLimit({
      request,
      scope: "unsubscribe",
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: "Too many unsubscribe attempts. Please try again shortly.",
        },
        { status: 429 },
      );
    }

    const payload = (await request.json()) as {
      email?: string;
      token?: string;
      reason?: "too_many_emails" | "not_relevant" | "signed_up_by_mistake" | "prefer_another_channel" | "other";
      feedback?: string;
    };
    const result = await unsubscribeFromNewsletter({
      email: payload.email ?? "",
      token: payload.token ?? "",
      reason: payload.reason,
      feedback: payload.feedback,
    });

    return NextResponse.json(
      {
        ok: result.ok,
        message: result.message,
      },
      { status: result.ok ? 200 : 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unsubscribe failed.";
    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}

/** Double opt-in completion: verifies signed token, promotes pending → active subscriber, sends welcome. */
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/newsletter/rate-limit";
import { confirmNewsletterSubscription } from "@/lib/newsletter/service";
import type { NewsletterApiResponse } from "@/types/newsletter";

export async function POST(request: Request): Promise<NextResponse<NewsletterApiResponse>> {
  try {
    const rateLimit = await applyRateLimit({
      request,
      scope: "confirm",
      maxRequests: 12,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: "Too many confirmation attempts. Please try again shortly.",
        },
        { status: 429 },
      );
    }

    const payload = (await request.json()) as { email?: string; token?: string };
    const result = await confirmNewsletterSubscription({
      email: payload.email ?? "",
      token: payload.token ?? "",
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
      error instanceof Error ? error.message : "Confirmation failed.";
    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}

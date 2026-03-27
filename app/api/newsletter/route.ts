import { NextResponse } from "next/server";
import {
  subscribeToNewsletter,
  validateNewsletterPayload,
} from "@/lib/newsletter/service";
import { applyRateLimit } from "@/lib/newsletter/rate-limit";
import type {
  NewsletterApiResponse,
  NewsletterSubscribeRequest,
} from "@/types/newsletter";

export async function POST(request: Request): Promise<NextResponse<NewsletterApiResponse>> {
  try {
    const rateLimit = await applyRateLimit({
      request,
      scope: "subscribe",
      maxRequests: 8,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: "Too many requests. Please try again in a minute.",
        },
        { status: 429 },
      );
    }

    const payload = (await request.json()) as NewsletterSubscribeRequest;
    const errorMessage = validateNewsletterPayload(payload);

    if (errorMessage) {
      return NextResponse.json(
        {
          ok: false,
          message: errorMessage,
        },
        { status: 400 },
      );
    }

    const result = await subscribeToNewsletter(payload);
    return NextResponse.json(
      {
        ok: result.ok,
        message: result.message,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Subscription failed";
    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}

/** Admin-only AI draft helper: rate-limited; tries Groq → Gemini → OpenRouter in lib. */
import { NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-api-auth";
import { generateComposerDraftWithFallback } from "@/lib/admin/ai-composer-fill";
import { applyRateLimit } from "@/lib/newsletter/rate-limit";
import type { AiComposerFillResponse } from "@/types/admin";

export async function POST(
  request: Request,
): Promise<NextResponse<{ ok: boolean; message?: string; data?: AiComposerFillResponse }>> {
  if (!(await assertAdminSession())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const limited = await applyRateLimit({
    request,
    scope: "admin-ai-composer",
    maxRequests: 12,
    windowSeconds: 3600,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many AI requests. Try again later." },
      { status: 429 },
    );
  }

  const body = (await request.json()) as { brief?: string };
  try {
    const data = await generateComposerDraftWithFallback(body.brief ?? "");
    console.info("[composer-assist] providerUsed=%s", data.providerUsed);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed.";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}

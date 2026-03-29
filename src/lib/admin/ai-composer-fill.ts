import type { AiComposerFillPayload, AiComposerFillResponse, AiComposerProviderId } from "@/types/admin";
import type { BroadcastAudience } from "@/types/newsletter";

/** Server-only LLM calls with ordered fallback; parses JSON-shaped reply into broadcast fields. */
const SYSTEM = `You help admins draft MixMaster newsletter posts about cocktails, recipes, and bar culture.
Return ONLY a single JSON object (no markdown fences) with keys:
subject (string), preheader (string), body (string, use \\n for line breaks),
ctaLabel (string, optional), ctaUrl (string, optional, must be https if present),
audience (string: one of "all", "recent", "engaged").
Keep subject under 90 chars, preheader under 120 chars, body concise but useful.`;

function extractJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fence ? fence[1]!.trim() : trimmed;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object.");
  }
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

function normalizeAudience(value: unknown): BroadcastAudience {
  if (value === "recent" || value === "engaged") {
    return value;
  }
  return "all";
}

function toPayload(data: Record<string, unknown>): AiComposerFillPayload {
  const subject = String(data.subject ?? "").trim();
  const preheader = String(data.preheader ?? "").trim();
  const body = String(data.body ?? "").trim().replaceAll("\\n", "\n");
  if (!subject || !preheader || !body) {
    throw new Error("Missing subject, preheader, or body in model output.");
  }
  const ctaLabel = data.ctaLabel != null ? String(data.ctaLabel).trim() : "";
  const ctaUrl = data.ctaUrl != null ? String(data.ctaUrl).trim() : "";
  const audience = normalizeAudience(data.audience);
  return {
    subject,
    preheader,
    body,
    ctaLabel: ctaLabel || undefined,
    ctaUrl: ctaUrl && /^https:\/\//.test(ctaUrl) ? ctaUrl : undefined,
    audience,
  };
}

async function callGroq(userPrompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY not set");
  }
  const model = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const err = new Error(`Groq HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Groq returned empty content");
  }
  return text;
}

async function callGemini(userPrompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY not set");
  }
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM}\n\nUser request:\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) {
    const err = new Error(`Gemini HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) {
    throw new Error("Gemini returned empty content");
  }
  return text;
}

async function callOpenRouter(userPrompt: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY not set");
  }
  const model = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";
  const site = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": site,
      "X-Title": "MixMaster Admin",
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const err = new Error(`OpenRouter HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("OpenRouter returned empty content");
  }
  return text;
}

const ORDER: AiComposerProviderId[] = ["groq", "gemini", "openrouter"];

export async function generateComposerDraftWithFallback(brief: string): Promise<AiComposerFillResponse> {
  const userPrompt =
    brief.trim() ||
    "Write a friendly weekly newsletter post highlighting one classic cocktail, one seasonal idea, and a short tip for home bartenders.";
  const errors: string[] = [];

  for (const provider of ORDER) {
    try {
      let raw: string;
      if (provider === "groq") {
        raw = await callGroq(userPrompt);
      } else if (provider === "gemini") {
        raw = await callGemini(userPrompt);
      } else {
        raw = await callOpenRouter(userPrompt);
      }
      const parsed = extractJsonObject(raw);
      const payload = toPayload(parsed);
      return { ...payload, providerUsed: provider };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${provider}: ${msg}`);
    }
  }

  throw new Error(
    `All AI providers failed or are not configured. Details: ${errors.join(" | ")}`,
  );
}

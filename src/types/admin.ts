import type { BroadcastAudience } from "@/types/newsletter";

/** Types for AI composer-assist API responses. */
export type AiComposerProviderId = "groq" | "gemini" | "openrouter";

export interface AiComposerFillPayload {
  subject: string;
  preheader: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  audience?: BroadcastAudience;
}

export interface AiComposerFillResponse extends AiComposerFillPayload {
  providerUsed: AiComposerProviderId;
}

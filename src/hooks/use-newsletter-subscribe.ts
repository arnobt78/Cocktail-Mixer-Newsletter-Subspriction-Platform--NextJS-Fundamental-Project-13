"use client";

/** Encapsulates POST /api/newsletter + loading state + context email for downstream pages. */
import { useState } from "react";
import { useNewsletterContext } from "@/context/newsletter-context";
import type {
  NewsletterApiResponse,
  NewsletterSubscribeRequest,
} from "@/types/newsletter";

interface UseNewsletterSubscribeResult {
  isSubmitting: boolean;
  subscribe: (payload: NewsletterSubscribeRequest) => Promise<NewsletterApiResponse>;
}

export function useNewsletterSubscribe(): UseNewsletterSubscribeResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setLastSubscribedEmail } = useNewsletterContext();

  async function subscribe(
    payload: NewsletterSubscribeRequest,
  ): Promise<NewsletterApiResponse> {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as NewsletterApiResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Subscription failed.");
      }

      setLastSubscribedEmail(payload.email.trim().toLowerCase());
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, subscribe };
}

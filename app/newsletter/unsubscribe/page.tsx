"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MailX, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/ui/ripple-button";
import type { UnsubscribeReason } from "@/types/newsletter";

const REASONS: Array<{ value: UnsubscribeReason; label: string }> = [
  { value: "too_many_emails", label: "Too many emails" },
  { value: "not_relevant", label: "Content not relevant to me" },
  { value: "signed_up_by_mistake", label: "I signed up by mistake" },
  { value: "prefer_another_channel", label: "I prefer another channel" },
  { value: "other", label: "Other reason" },
];

export default function NewsletterUnsubscribePage() {
  const params = useSearchParams();
  const [reason, setReason] = useState<UnsubscribeReason>("not_relevant");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, reason, feedback }),
      });

      const data = (await response.json()) as { ok: boolean; message: string };
      setResult(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-9xl items-center justify-center px-4 py-12 sm:px-8">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border-cyan-300/20 p-8 text-left">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
          <MailX className="h-3.5 w-3.5" />
          Newsletter
        </div>
        <h1 className="mb-3 text-3xl font-bold text-white font-heading">
          Unsubscribe preferences
        </h1>
        <p className="mb-6 text-sm text-slate-300">
          We are sorry to see you go. Let us know why so we can improve.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reason"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Reason
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value as UnsubscribeReason)}
              className="w-full rounded-md border border-white/15 bg-slate-900/50 px-3 py-2 text-sm text-slate-100"
            >
              {REASONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="feedback"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Optional feedback
            </label>
            <Input
              id="feedback"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Tell us what we can improve"
              className="border-white/15 bg-slate-900/50 text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <RippleButton
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-cyan-300/40 bg-gradient-to-r from-cyan-500/75 to-emerald-500/65 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <MailX className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Confirm unsubscribe"}
          </RippleButton>
        </form>

        {result ? (
          <p className={`mt-5 text-sm ${result.ok ? "text-emerald-200" : "text-rose-200"}`}>
            {result.message}
          </p>
        ) : null}

        <Link
          href="/newsletter"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to newsletter
        </Link>
      </div>
    </section>
  );
}

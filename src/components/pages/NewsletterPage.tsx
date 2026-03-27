"use client";

import { useState, type FormEvent } from "react";
import { MailCheck, Send, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/ui/ripple-button";
import { activityToast } from "@/lib/activity-toast";
import { useNewsletterSubscribe } from "@/hooks/use-newsletter-subscribe";
import { useNewsletterContext } from "@/context/newsletter-context";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
}

export function NewsletterPage() {
  const { isSubmitting, subscribe } = useNewsletterSubscribe();
  const { lastSubscribedEmail } = useNewsletterContext();
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const data = await subscribe(form);
      activityToast({
        icon: <MailCheck className="h-4 w-4" />,
        title: "Newsletter subscribed",
        description: `${data.message} Please check your inbox and spam folder.`,
      });
      setForm({ firstName: "", lastName: "", email: "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      activityToast({
        icon: <Send className="h-4 w-4" />,
        title: "Subscription failed",
        description: message,
      });
    }
  }

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-10 sm:px-8">
      <form
        onSubmit={onSubmit}
        className="glass-panel mx-auto w-full max-w-7xl rounded-[26px] border-cyan-300/20 p-6 shadow-[0_25px_80px_rgba(56,189,248,0.2)] sm:p-8"
      >
        <div className="mb-5 flex flex-col items-start gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Newsletter
          </div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-white font-heading">
            <MailCheck className="h-7 w-7 text-cyan-200" />
            Our Newsletter
          </h1>
        </div>
        <p className="mb-6 text-sm uppercase tracking-[0.25em] text-cyan-200/85">
          Weekly cocktail discoveries, UI patterns, and production-ready
          frontend tips
        </p>
        {lastSubscribedEmail ? (
          <p className="mb-6 text-xs text-emerald-200/90">
            Last subscribed: {lastSubscribedEmail}
          </p>
        ) : null}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              First name
            </label>
            <Input
              id="firstName"
              placeholder="John"
              value={form.firstName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, firstName: event.target.value }))
              }
              className="border-white/15 bg-slate-900/50 text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Last name
            </label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={form.lastName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, lastName: event.target.value }))
              }
              className="border-white/15 bg-slate-900/50 text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="border-white/15 bg-slate-900/50 text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
        </div>
        <div className="mt-6 flex justify-center pb-2">
          <div className="w-full max-w-sm rounded-lg drop-shadow-[0_20px_38px_rgba(56,189,248,0.36)]">
            <div className="cta-shine-wrap w-full rounded-lg">
              <RippleButton
                type="submit"
                disabled={isSubmitting}
                className="cta-shine-button w-full rounded-lg border border-cyan-300/40 bg-gradient-to-r from-cyan-500/75 to-emerald-500/65 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit"}
              </RippleButton>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}

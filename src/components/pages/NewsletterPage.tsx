"use client";

/**
 * Marketing + signup form: useNewsletterSubscribe POSTs to /api/newsletter; context stores last email for confirm UX.
 */
import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import {
  BookOpen,
  CheckCircle2,
  Inbox,
  MailCheck,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/ui/ripple-button";
import { activityToast } from "@/lib/activity-toast";
import {
  newsletterItemMotion,
  newsletterSectionMotion,
  panelLiftMotion,
} from "@/lib/page-motion-variants";
import { useNewsletterSubscribe } from "@/hooks/use-newsletter-subscribe";
import { useNewsletterContext } from "@/context/newsletter-context";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
}

const VALUE_ROWS = [
  {
    title: "Curated cocktail picks",
    body: "A short list of standout serves we are mixing, testing, and refining each week.",
    icon: Sparkles,
    accent: "text-cyan-200",
  },
  {
    title: "UI build notes",
    body: "Patterns we shipped in MixMaster—what worked, what we would simplify next time.",
    icon: BookOpen,
    accent: "text-emerald-200",
  },
  {
    title: "Production-ready tips",
    body: "Deploy guardrails, performance checks, and accessibility reminders you can paste into real projects.",
    icon: ShieldCheck,
    accent: "text-violet-200",
  },
  {
    title: "Inbox respect",
    body: "Double opt-in, one-click unsubscribe, and no selling your address. Ever.",
    icon: Inbox,
    accent: "text-amber-200",
  },
] as const;

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
      <motion.div {...panelLiftMotion} className="mx-auto w-full max-w-9xl">
        <motion.form
          onSubmit={onSubmit}
          variants={newsletterSectionMotion}
          initial="hidden"
          animate="visible"
          className="glass-panel w-full rounded-[26px] border-cyan-300/20 p-6 shadow-[0_25px_80px_rgba(56,189,248,0.2)] sm:p-8"
        >
          <motion.div
            variants={newsletterItemMotion}
            className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Weekly digest
            </div>
            <Badge className="border border-emerald-300/35 bg-emerald-500/15 text-emerald-100">
              Free · opt-in required
            </Badge>
          </motion.div>

          <motion.div variants={newsletterItemMotion} className="mb-2">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl sm:text-3xl font-bold text-white font-heading">
              <MailCheck className="h-8 w-8 shrink-0 text-cyan-200" />
              MixMaster dispatch
            </h1>
          </motion.div>

          <motion.p
            variants={newsletterItemMotion}
            className="text-base font-medium leading-relaxed text-slate-200"
          >
            One email a week for people who care about craft drinks and polished
            frontends—short, practical, and easy to skim on a Friday afternoon.
          </motion.p>

          <motion.p
            variants={newsletterItemMotion}
            className="mt-3 text-sm uppercase tracking-[0.22em] text-cyan-200/90"
          >
            Cocktail finds · interface craft · ship-with-confidence checklists
          </motion.p>

          <motion.p
            variants={newsletterItemMotion}
            className="mt-4 text-sm leading-relaxed text-slate-400"
          >
            Small batch updates from the same team building this app: what we
            are pouring, how we structure complex UI, and the strategies we use
            before every production deploy.
          </motion.p>

          <motion.div
            variants={newsletterItemMotion}
            className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {VALUE_ROWS.map((row) => (
              <div
                key={row.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left"
              >
                <div className="mb-2 flex items-center gap-2">
                  <row.icon className={`h-4 w-4 shrink-0 ${row.accent}`} />
                  <span className="text-sm font-semibold text-slate-100">
                    {row.title}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  {row.body}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div
            variants={newsletterItemMotion}
            className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-500/[0.06] px-4 py-3 text-sm text-cyan-100/95"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-300" />
            <span>
              After you join, confirm from your inbox so we know it is really
              you—then you are on the list.
            </span>
          </motion.div>

          {lastSubscribedEmail ? (
            <motion.p
              variants={newsletterItemMotion}
              className="mt-4 text-xs text-emerald-200/90"
            >
              Last subscribed address on this device:{" "}
              <span className="font-medium text-emerald-100">
                {lastSubscribedEmail}
              </span>
            </motion.p>
          ) : null}

          <motion.div
            variants={newsletterItemMotion}
            className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 md:col-span-3">
              Your details
            </p>
            <div className="min-w-0">
              <label
                htmlFor="firstName"
                className="mb-1 block text-sm font-medium text-slate-200"
              >
                First name
              </label>
              <Input
                id="firstName"
                placeholder="e.g. Jordan"
                value={form.firstName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    firstName: event.target.value,
                  }))
                }
                className="border-white/15 bg-slate-900/50 text-slate-100 placeholder:text-slate-400"
                required
                autoComplete="given-name"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="lastName"
                className="mb-1 block text-sm font-medium text-slate-200"
              >
                Last name
              </label>
              <Input
                id="lastName"
                placeholder="e.g. Lee"
                value={form.lastName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
                className="border-white/15 bg-slate-900/50 text-slate-100 placeholder:text-slate-400"
                required
                autoComplete="family-name"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-200"
              >
                Work or personal email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="border-white/15 bg-slate-900/50 text-slate-100 placeholder:text-slate-400"
                required
                autoComplete="email"
              />
            </div>
          </motion.div>

          <motion.div
            variants={newsletterItemMotion}
            className="mt-8 flex justify-center pb-1"
          >
            <div className="w-full max-w-md rounded-lg drop-shadow-[0_20px_38px_rgba(56,189,248,0.36)] sm:max-w-lg lg:max-w-xl">
              <div className="cta-shine-wrap w-full rounded-lg">
                <RippleButton
                  type="submit"
                  disabled={isSubmitting}
                  className="cta-shine-button w-full rounded-lg border border-cyan-300/40 bg-gradient-to-r from-cyan-500/75 to-emerald-500/65 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting
                    ? "Sending confirmation…"
                    : "Join the weekly digest"}
                </RippleButton>
              </div>
            </div>
          </motion.div>

          <motion.p
            variants={newsletterItemMotion}
            className="mt-4 text-center text-xs text-slate-400"
          >
            We only use your email for this newsletter. Unsubscribe anytime from
            the footer of any message.
          </motion.p>
        </motion.form>
      </motion.div>
    </section>
  );
}

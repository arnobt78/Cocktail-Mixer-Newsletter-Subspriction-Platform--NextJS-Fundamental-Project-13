"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck, ArrowLeft } from "lucide-react";

export default function NewsletterConfirmPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<{
    loading: boolean;
    ok: boolean;
    message: string;
  }>({
    loading: true,
    ok: false,
    message: "Confirming your subscription...",
  });

  useEffect(() => {
    async function run() {
      const email = params.get("email") ?? "";
      const token = params.get("token") ?? "";

      if (!email || !token) {
        setStatus({
          loading: false,
          ok: false,
          message: "Invalid confirmation link.",
        });
        return;
      }

      const response = await fetch("/api/newsletter/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });

      const data = (await response.json()) as { ok: boolean; message: string };
      setStatus({
        loading: false,
        ok: data.ok,
        message: data.message,
      });
    }

    void run();
  }, [params]);

  return (
    <section className="mx-auto flex w-full max-w-9xl items-center justify-center px-4 py-12 sm:px-8">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border-cyan-300/20 p-8 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
          <MailCheck className="h-3.5 w-3.5" />
          Newsletter
        </div>
        <h1 className="mb-3 text-3xl font-bold text-white font-heading">
          {status.loading
            ? "Confirming..."
            : status.ok
              ? "Subscription confirmed"
              : "Confirmation failed"}
        </h1>
        <p className={`mb-8 text-sm ${status.ok ? "text-emerald-200" : "text-slate-300"}`}>
          {status.message}
        </p>
        <Link
          href="/newsletter"
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to newsletter
        </Link>
      </div>
    </section>
  );
}

"use client";

/** Static educational copy from src/data/content.ts (feature list + tips). */
import {
  BookOpenText,
  FlaskConical,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { aboutText, beginnerTips, featureHighlights } from "@/data/content";

export function AboutPage() {
  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-10 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="glass-panel mx-auto max-w-9xl rounded-[26px] border-emerald-300/20 p-6 shadow-[0_25px_80px_rgba(16,185,129,0.2)] sm:p-8"
      >
        <div className="mb-4 flex flex-col items-start gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            About
          </div>
          <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-white font-heading">
            <FlaskConical className="h-8 w-8 text-emerald-200" />
            About Us
          </h1>
        </div>
        <p className="mb-6 text-sm uppercase tracking-[0.25em] text-emerald-200/85">
          Build modern full-stack learning workflows with real product patterns
        </p>
        <p className="mb-8 leading-7 text-slate-200">{aboutText}</p>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {featureHighlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              whileHover={{ y: -4 }}
            >
              <Card className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-slate-100 transition duration-200 hover:border-emerald-300/35 hover:bg-white/[0.06] hover:shadow-[0_16px_40px_rgba(16,185,129,0.18)]">
                <div className="mb-2 flex items-center gap-2">
                  {index % 2 === 0 ? (
                    <Layers3 className="h-4 w-4 text-cyan-200" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  )}
                  <h3 className="text-base font-semibold text-white">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-300">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <h2 className="mb-2 inline-flex items-center gap-2 text-2xl font-semibold text-white">
          <BookOpenText className="h-5 w-5 text-cyan-200" />
          Implementation Notes
        </h2>
        <p className="mb-4 text-sm text-slate-300">
          Practical notes for understanding architecture, safety, and production
          behavior.
        </p>
        <ul className="space-y-3">
          {beginnerTips.map((tip, index) => (
            <motion.li
              key={tip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.04 }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <Badge className="bg-emerald-400/25 text-emerald-100">{`Tip ${index + 1}`}</Badge>
              <span className="ml-3 text-slate-200">{tip}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}

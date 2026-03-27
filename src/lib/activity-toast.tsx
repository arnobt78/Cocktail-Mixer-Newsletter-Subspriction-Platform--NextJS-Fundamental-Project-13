"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";

interface ActivityToastOptions {
  id?: string;
  icon: ReactNode;
  title: string;
  description: string;
}

export function activityToast({
  id,
  icon,
  title,
  description,
}: ActivityToastOptions): void {
  toast.custom(
    () => (
      <div className="glass-panel z-[9999] flex w-[320px] items-start gap-3 rounded-xl border-white/20 px-4 py-3 shadow-[0_20px_40px_rgba(15,23,42,0.5)]">
        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-200">
          {icon}
        </span>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          <p className="text-xs text-slate-300">{description}</p>
        </div>
      </div>
    ),
    { id },
  );
}

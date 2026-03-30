"use client";

import type { ComponentPropsWithoutRef, PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AlertDialogProps extends PropsWithChildren {
  open: boolean;
  className?: string;
}

export function AlertDialog({ open, children, className }: AlertDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={cn("fixed inset-0 z-[70]", className)}>{children}</div>
  );
}

export function AlertDialogOverlay({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-slate-950/75 backdrop-blur-md",
        "shadow-[inset_0_0_120px_rgba(2,6,23,0.85)]",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDialogContent({
  className,
  children,
  ...props
}: PropsWithChildren<{ className?: string } & ComponentPropsWithoutRef<"div">>) {
  return (
    <div
      className={cn(
        "absolute left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-400/25 bg-slate-950/92 p-6",
        "shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_50px_-8px_rgba(34,211,238,0.35),0_0_80px_-20px_rgba(6,182,212,0.25),0_25px_100px_rgba(2,6,23,0.75)]",
        "ring-2 ring-cyan-400/20",
        "sm:w-full",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDialogHeader({ children }: PropsWithChildren) {
  return (
    <div className="mb-5 flex items-start justify-between">{children}</div>
  );
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-white font-heading">{children}</h2>
  );
}

export function AlertDialogDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  /** `div` (not `p`) so children may include buttons without invalid HTML / hydration bugs. */
  return (
    <div className={cn("mt-1 text-sm leading-relaxed text-slate-300", className)}>
      {children}
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800",
        className,
      )}
    />
  );
}

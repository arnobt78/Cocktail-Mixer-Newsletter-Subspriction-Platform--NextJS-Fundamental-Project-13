/** Logo + wordmark linking home—shared by Navbar and admin header. */
import Link from "next/link";
import { Martini } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex min-w-0 items-center gap-2 text-md md:text-2xl font-semibold tracking-tight font-heading",
        className,
      )}
    >
      <span className="inline-flex h-7 w-7 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400/20 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.45)] transition group-hover:scale-105">
        <Martini className="h-4 w-4 md:h-5 md:w-5" />
      </span>
      <span className="truncate bg-gradient-to-r from-emerald-200 via-emerald-300 to-cyan-200 bg-clip-text text-transparent">
        MixMaster
      </span>
    </Link>
  );
}

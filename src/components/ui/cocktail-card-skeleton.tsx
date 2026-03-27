import { Card } from "@/components/ui/card";

export function CocktailCardSkeleton() {
  return (
    <Card className="glass-panel min-h-[30rem] h-full w-full overflow-hidden rounded-[28px] border-white/15 bg-slate-900/40">
      <div className="h-56 w-full animate-pulse bg-slate-700/55" />
      <div className="space-y-3 p-6">
        <div className="h-8 w-36 animate-pulse rounded bg-slate-700/60" />
        <div className="h-5 w-28 animate-pulse rounded bg-slate-700/60" />
        <div className="h-5 w-24 animate-pulse rounded bg-slate-700/60" />
        <div className="h-5 w-24 animate-pulse rounded bg-slate-700/60" />
        <div className="h-4 w-32 animate-pulse rounded bg-slate-700/60" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-700/60" />
      </div>
    </Card>
  );
}

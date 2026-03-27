import { CocktailCardSkeleton } from "@/components/ui/cocktail-card-skeleton";

export default function Loading() {
  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-8 sm:px-8">
      <div className="glass-panel mb-8 rounded-[26px] border-emerald-300/20 p-6 shadow-[0_25px_80px_rgba(16,185,129,0.2)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="h-7 w-24 animate-pulse rounded-full bg-emerald-500/25" />
          <div className="h-10 w-72 animate-pulse rounded-md bg-slate-700/55" />
        </div>

        <div className="mb-4 grid w-full grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]">
          <div className="space-y-2">
            <div className="h-3 w-14 animate-pulse rounded bg-slate-700/55" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-slate-700/55" />
          </div>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`filter-skeleton-${idx}`} className="space-y-2">
              <div className="h-3 w-12 animate-pulse rounded bg-slate-700/55" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-slate-700/55" />
            </div>
          ))}
          <div className="h-11 w-28 animate-pulse rounded-lg bg-emerald-500/35" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[repeat(5,minmax(0,1fr))]">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={`button-skeleton-${idx}`}
              className="h-10 w-full animate-pulse rounded-lg bg-slate-700/55"
            />
          ))}
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <CocktailCardSkeleton key={`loading-${index}`} />
        ))}
      </div>
    </section>
  );
}

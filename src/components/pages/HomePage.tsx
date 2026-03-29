"use client";

/**
 * HomePage (client): search form updates the URL (?search=); TanStack Query refetches when the term changes.
 * SSR passes initialDrinks/initialSearchTerm so first paint matches the server. Favorites use localStorage +
 * useSyncExternalStore hydration guard to avoid SSR/client HTML mismatches.
 */
import { motion } from "framer-motion";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CircleDot,
  Clipboard,
  Filter,
  Heart,
  Layers3,
  Martini,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CocktailCardMedia } from "@/components/ui/cocktail-card-media";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/ui/ripple-button";
import { CocktailCardSkeleton } from "@/components/ui/cocktail-card-skeleton";
import { useCocktailsQuery } from "@/hooks/use-cocktails-query";
import type { CocktailCardItem } from "@/types/cocktail";
import { activityToast } from "@/lib/activity-toast";
import { getFavoriteIds, setFavoriteIds } from "@/lib/favorites-storage";
import {
  containerMotion,
  itemMotion,
  panelLiftMotion,
} from "@/lib/page-motion-variants";

interface HomePageProps {
  initialDrinks: CocktailCardItem[];
  initialSearchTerm: string;
}

type SortMode = "a-z" | "z-a";
type ViewMode = "cozy" | "compact";

const EMPTY_FAVORITES: string[] = [];

export function HomePage({ initialDrinks, initialSearchTerm }: HomePageProps) {
  const router = useRouter();
  const params = useSearchParams();
  const searchTerm = params.get("search") ?? "";
  const [inputValue, setInputValue] = useState(searchTerm || initialSearchTerm);
  const [filterInfo, setFilterInfo] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterGlass, setFilterGlass] = useState<string>("all");
  const [letterFilter, setLetterFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("a-z");
  const [viewMode, setViewMode] = useState<ViewMode>("cozy");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  // false on server, true after mount—so we do not render favorite-dependent UI from stale server HTML.
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return getFavoriteIds();
  });
  const [visibleCount, setVisibleCount] = useState(9);
  const activeFavorites = useMemo(
    () => (isHydrated ? favorites : EMPTY_FAVORITES),
    [isHydrated, favorites],
  );
  const initialData = useMemo(
    () => (searchTerm === initialSearchTerm ? initialDrinks : []),
    [initialDrinks, initialSearchTerm, searchTerm],
  );
  const {
    data: drinks = [],
    isFetching,
    isPending,
  } = useCocktailsQuery(searchTerm, initialData);
  const showDrinksSkeleton = isPending || (isFetching && drinks.length === 0);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = inputValue.trim();
    const query = value ? `?search=${encodeURIComponent(value)}` : "";
    setVisibleCount(9);
    router.push(`/${query}`);
    activityToast({
      icon: <Clipboard className="h-4 w-4" />,
      title: "Search applied",
      description: value
        ? `Showing results for "${value}"`
        : "Showing all cocktails",
    });
  }

  useEffect(() => {
    setFavoriteIds(favorites);
  }, [favorites]);

  const infoOptions = useMemo(
    () => ["all", ...new Set(drinks.map((drink) => drink.info))],
    [drinks],
  );
  const categoryOptions = useMemo(
    () => ["all", ...new Set(drinks.map((drink) => drink.category))],
    [drinks],
  );
  const glassOptions = useMemo(
    () => ["all", ...new Set(drinks.map((drink) => drink.glass))],
    [drinks],
  );

  const filteredDrinks = useMemo(() => {
    const afterFilters = drinks.filter((drink) => {
      const infoMatch = filterInfo === "all" || drink.info === filterInfo;
      const categoryMatch =
        filterCategory === "all" || drink.category === filterCategory;
      const glassMatch = filterGlass === "all" || drink.glass === filterGlass;
      const letterMatch =
        letterFilter === "all" ||
        drink.name.toLowerCase().startsWith(letterFilter.toLowerCase());
      const favoriteMatch =
        !showFavoritesOnly || activeFavorites.includes(drink.id);
      return (
        infoMatch && categoryMatch && glassMatch && letterMatch && favoriteMatch
      );
    });

    const sorted = [...afterFilters].sort((a, b) =>
      sortMode === "a-z"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );
    return sorted;
  }, [
    drinks,
    filterInfo,
    filterCategory,
    filterGlass,
    letterFilter,
    activeFavorites,
    showFavoritesOnly,
    sortMode,
  ]);

  const visibleDrinks = filteredDrinks.slice(0, visibleCount);
  const hasMore = visibleCount < filteredDrinks.length;

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      activityToast({
        id: "favorites-activity",
        icon: (
          <Heart className={`h-4 w-4 ${exists ? "" : "fill-emerald-300"}`} />
        ),
        title: exists ? "Removed from favorites" : "Added to favorites",
        description: `Total favorites: ${next.length}`,
      });
      return next;
    });
  }

  function resetFilters() {
    setFilterInfo("all");
    setFilterCategory("all");
    setFilterGlass("all");
    setLetterFilter("all");
    setSortMode("a-z");
    setShowFavoritesOnly(false);
    setVisibleCount(9);
  }

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-8 sm:px-8">
      <motion.div
        {...panelLiftMotion}
        className="glass-panel mb-8 rounded-[26px] border-emerald-300/20 p-6 shadow-[0_25px_80px_rgba(16,185,129,0.2)] sm:p-6"
      >
        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Discover
          </span>
          <div className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-full flex-1 space-y-2 pr-2">
              <h1 className="text-2xl font-semibold leading-[1.15] tracking-tight text-white sm:text-3xl font-heading">
                Find your next favorite cocktail
              </h1>
              <p className="text-base leading-relaxed text-slate-300">
                Search TheCocktailDB, layer filters by glass and spirit, then
                save hearts for the recipes you actually want behind the bar.
              </p>
            </div>
            <div
              className="flex h-10 w-fit shrink-0 items-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-950/35 px-3.5 text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:h-11 sm:px-4"
              title={`${visibleDrinks.length} cards visible of ${filteredDrinks.length} after filters`}
            >
              <Layers3
                className="h-4 w-4 shrink-0 text-emerald-400/80"
                aria-hidden
              />
              <span className="text-sm font-semibold tabular-nums sm:text-base">
                <span className="text-white">{visibleDrinks.length}</span>
                <span className="mx-0.5 text-emerald-400/70">/</span>
                <span className="text-emerald-200/90">
                  {filteredDrinks.length}
                </span>
              </span>
              <span className="text-[0.65rem] font-medium uppercase tracking-wider text-emerald-500/80">
                view
              </span>
            </div>
          </div>
        </div>

        <motion.form
          onSubmit={onSubmit}
          className="mb-4 grid w-full grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]"
        >
          <label className="w-full">
            <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Search className="h-3.5 w-3.5" />
              Search
            </span>
            <Input
              type="search"
              name="search"
              placeholder="Search cocktails..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              className="h-11 border-white/15 bg-slate-900/50 text-slate-100 placeholder:text-slate-400"
            />
          </label>

          <label className="w-full">
            <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Filter className="h-3.5 w-3.5" />
              Info
            </span>
            <select
              value={filterInfo}
              onChange={(event) => {
                setFilterInfo(event.target.value);
                setVisibleCount(9);
              }}
              className="h-11 w-full rounded-lg border border-white/15 bg-slate-900/50 px-3 text-sm text-slate-100 outline-none ring-emerald-300 transition focus:ring-2"
            >
              {infoOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                  className="bg-slate-900 text-slate-100"
                >
                  {option === "all" ? "All Info" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="w-full">
            <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Martini className="h-3.5 w-3.5" />
              Category
            </span>
            <select
              value={filterCategory}
              onChange={(event) => {
                setFilterCategory(event.target.value);
                setVisibleCount(9);
              }}
              className="h-11 w-full rounded-lg border border-white/15 bg-slate-900/50 px-3 text-sm text-slate-100 outline-none ring-emerald-300 transition focus:ring-2"
            >
              {categoryOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                  className="bg-slate-900 text-slate-100"
                >
                  {option === "all" ? "All Category" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="w-full">
            <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Glass
            </span>
            <select
              value={filterGlass}
              onChange={(event) => {
                setFilterGlass(event.target.value);
                setVisibleCount(9);
              }}
              className="h-11 w-full rounded-lg border border-white/15 bg-slate-900/50 px-3 text-sm text-slate-100 outline-none ring-emerald-300 transition focus:ring-2"
            >
              {glassOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                  className="bg-slate-900 text-slate-100"
                >
                  {option === "all" ? "All Glass" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="w-full">
            <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <ArrowDownAZ className="h-3.5 w-3.5" />
              Letter
            </span>
            <select
              value={letterFilter}
              onChange={(event) => {
                setLetterFilter(event.target.value);
                setVisibleCount(9);
              }}
              className="h-11 w-full rounded-lg border border-white/15 bg-slate-900/50 px-3 text-sm text-slate-100 outline-none ring-emerald-300 transition focus:ring-2"
            >
              <option value="all" className="bg-slate-900 text-slate-100">
                All
              </option>
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                <option
                  key={letter}
                  value={letter.toLowerCase()}
                  className="bg-slate-900 text-slate-100"
                >
                  {letter}
                </option>
              ))}
            </select>
          </label>

          <div className="flex w-full min-w-0 flex-col justify-end">
            <span
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-transparent select-none"
              aria-hidden
            >
              &nbsp;
            </span>
            <div className="cta-shine-wrap rounded-lg">
              <RippleButton
                type="submit"
                className="cta-shine-button inline-flex h-11 w-full min-w-[7.5rem] items-center justify-center gap-2 rounded-lg border border-emerald-300/40 bg-gradient-to-r from-emerald-500/80 via-emerald-500/60 to-cyan-500/60 px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(16,185,129,0.45)] sm:w-auto"
              >
                <Search className="h-4 w-4 shrink-0" />
                Search
              </RippleButton>
            </div>
          </div>
        </motion.form>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <RippleButton
            type="button"
            onClick={() =>
              setSortMode((prev) => (prev === "a-z" ? "z-a" : "a-z"))
            }
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-white/15 bg-slate-800/50 px-3 text-sm text-slate-100 hover:bg-slate-700/60"
          >
            {sortMode === "a-z" ? (
              <ArrowDownAZ className="h-4 w-4" />
            ) : (
              <ArrowUpAZ className="h-4 w-4" />
            )}
            {sortMode === "a-z" ? "A-Z" : "Z-A"}
          </RippleButton>
          <RippleButton
            type="button"
            onClick={() => {
              setShowFavoritesOnly((prev) => !prev);
              setVisibleCount(9);
              activityToast({
                icon: <Heart className="h-4 w-4" />,
                title: !showFavoritesOnly
                  ? "Favorites view enabled"
                  : "Favorites view disabled",
                description: !showFavoritesOnly
                  ? "Showing only your favorite cocktails"
                  : "Showing all cocktails",
              });
            }}
            className={`inline-flex h-10 items-center justify-center gap-1 rounded-lg border px-3 text-sm transition ${
              showFavoritesOnly
                ? "border-rose-300/45 bg-rose-500/25 text-rose-100"
                : "border-white/15 bg-slate-800/50 text-slate-100 hover:bg-slate-700/60"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${showFavoritesOnly ? "fill-rose-200" : ""}`}
            />
            Favorites
            <Badge className="ml-1 bg-rose-400/20 text-rose-100">
              {activeFavorites.length}
            </Badge>
          </RippleButton>
          <RippleButton
            type="button"
            onClick={() =>
              setViewMode((prev) => (prev === "cozy" ? "compact" : "cozy"))
            }
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-white/15 bg-slate-800/50 px-3 text-sm text-slate-100 hover:bg-slate-700/60"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {viewMode === "cozy" ? "Cozy" : "Compact"}
          </RippleButton>
          <RippleButton
            type="button"
            onClick={resetFilters}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/15 bg-slate-800/50 px-3 text-sm text-slate-100 hover:bg-slate-700/60"
          >
            Reset All Filters
          </RippleButton>
        </div>
      </motion.div>

      {!showDrinksSkeleton && filteredDrinks.length === 0 ? (
        <p className="text-center text-lg font-semibold text-slate-300">
          No matching cocktails found...
        </p>
      ) : null}

      {showDrinksSkeleton ? (
        <div
          className={`grid w-full gap-6 ${
            viewMode === "cozy"
              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <CocktailCardSkeleton />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerMotion}
          initial="hidden"
          animate="visible"
          className={`grid w-full gap-6 ${
            viewMode === "cozy"
              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {visibleDrinks.map((drink, index) => (
            <motion.article
              key={drink.id}
              variants={itemMotion}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass-panel min-h-[30rem] min-w-0 h-full overflow-hidden rounded-[28px] border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                <div className="relative">
                  <CocktailCardMedia
                    src={drink.image}
                    alt={drink.name}
                    sizes="(max-width: 1200px) 100vw, 33vw"
                  />
                  <div className="absolute right-3 top-3 z-20">
                    <RippleButton
                      type="button"
                      onClick={() => toggleFavorite(drink.id)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-sm ${
                        activeFavorites.includes(drink.id)
                          ? "border-rose-300/40 bg-rose-500/30 text-rose-100"
                          : "border-white/25 bg-slate-900/50 text-slate-200 hover:bg-slate-800/70"
                      }`}
                      aria-label={`Toggle favorite for ${drink.name}`}
                    >
                      <Heart
                        className={`h-4 w-4 ${activeFavorites.includes(drink.id) ? "fill-rose-200" : ""}`}
                      />
                    </RippleButton>
                  </div>
                </div>
                <div className="flex h-[calc(100%-14rem)] flex-col p-6 text-slate-100">
                  <h2 className="line-clamp-1 text-3xl font-bold leading-tight font-heading">
                    {drink.name}
                  </h2>
                  <p className="mt-1 text-lg text-slate-200">{drink.glass}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="bg-emerald-400/25 text-emerald-100">
                      {drink.info}
                    </Badge>
                    <Badge className="bg-violet-400/25 text-violet-100">
                      {drink.category}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <CircleDot className="h-3.5 w-3.5 text-cyan-200" />#
                      {drink.id}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Layers3 className="h-3.5 w-3.5 text-emerald-200" />
                      {drink.name.length} chars
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <Link
                      href={`/cocktail/${drink.id}`}
                      className="inline-flex items-center rounded-lg border border-emerald-300/40 bg-emerald-500/70 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(16,185,129,0.45)] hover:bg-emerald-500"
                    >
                      View Details
                    </Link>
                    <Badge className="bg-slate-200/15 text-slate-100">
                      ID {drink.id}
                    </Badge>
                  </div>
                </div>
              </Card>
            </motion.article>
          ))}
        </motion.div>
      )}

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <RippleButton
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="inline-flex items-center rounded-xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500/60 to-emerald-500/60 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(20,184,166,0.35)]"
          >
            Load More
          </RippleButton>
        </div>
      ) : null}
    </section>
  );
}

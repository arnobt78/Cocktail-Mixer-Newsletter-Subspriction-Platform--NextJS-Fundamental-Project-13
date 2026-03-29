"use client";

/**
 * Lists favorited drink IDs from localStorage, then fetches each drink from TheCocktailDB for cards (client-only data).
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Martini, Trash2 } from "lucide-react";
import { CocktailCardMedia } from "@/components/ui/cocktail-card-media";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RippleButton } from "@/components/ui/ripple-button";
import { CocktailCardSkeleton } from "@/components/ui/cocktail-card-skeleton";
import { activityToast } from "@/lib/activity-toast";
import {
  getFavoriteIds,
  setFavoriteIds,
  subscribeFavorites,
} from "@/lib/favorites-storage";
import {
  containerMotion,
  itemMotion,
  panelLiftMotion,
} from "@/lib/page-motion-variants";
import type {
  CocktailCardItem,
  CocktailLookupResponse,
} from "@/types/cocktail";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://www.thecocktaildb.com/api/json/v1/1";

export function FavoritesPage() {
  /** Start empty so SSR + first client paint match; sync from localStorage after mount. */
  const [favoriteIds, setFavoriteIdsState] = useState<string[]>([]);
  /** False until the first client read of localStorage — avoids treating initial [] as "no favorites". */
  const [storageReady, setStorageReady] = useState(false);
  const [drinks, setDrinks] = useState<CocktailCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /* Sync from localStorage after mount; not useSyncExternalStore(getFavoriteIds) because
       JSON snapshots still hydrate as [] before the first paint, which races the fetch effect. */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only storage read
    setFavoriteIdsState(getFavoriteIds());
    setStorageReady(true);
    return subscribeFavorites(() => {
      setFavoriteIdsState(getFavoriteIds());
    });
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    let cancelled = false;
    async function loadFavorites() {
      if (favoriteIds.length === 0) {
        if (!cancelled) {
          setDrinks([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      const results = await Promise.all(
        favoriteIds.map(async (id) => {
          const response = await fetch(
            `${apiBaseUrl}/lookup.php?i=${encodeURIComponent(id)}`,
          );
          if (!response.ok) {
            return null;
          }
          const data = (await response.json()) as CocktailLookupResponse;
          const item = data.drinks?.[0];
          if (!item) return null;
          return {
            id: item.idDrink,
            name: item.strDrink,
            image: item.strDrinkThumb,
            info: item.strAlcoholic,
            category: item.strCategory,
            glass: item.strGlass,
          } satisfies CocktailCardItem;
        }),
      );

      if (!cancelled) {
        setDrinks(
          results.filter((item): item is CocktailCardItem => Boolean(item)),
        );
        setIsLoading(false);
      }
    }

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, [favoriteIds, storageReady]);

  const orderedDrinks = useMemo(
    () =>
      [...drinks].sort(
        (a, b) => favoriteIds.indexOf(a.id) - favoriteIds.indexOf(b.id),
      ),
    [drinks, favoriteIds],
  );

  function removeFavorite(id: string, name: string) {
    const next = favoriteIds.filter((item) => item !== id);
    setFavoriteIds(next);
    activityToast({
      id: "favorites-activity",
      icon: <Trash2 className="h-4 w-4" />,
      title: "Removed favorite",
      description: `${name} removed from your favorites list`,
    });
  }

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-8 sm:px-8">
      <motion.div
        {...panelLiftMotion}
        className="glass-panel mb-8 rounded-[26px] border-rose-300/20 p-6 shadow-[0_25px_80px_rgba(244,63,94,0.2)]"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-rose-200">
          <Heart className="h-3.5 w-3.5" />
          Favorites
        </div>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-white font-heading">
          Your Favorite Cocktails
        </h1>
        <p className="mt-2 text-slate-300">
          Saved drinks appear here for faster access and comparison.
        </p>
        <div className="mt-4 inline-flex min-w-[10rem] rounded-lg border border-rose-300/20 bg-rose-400/10 px-3 py-1.5 text-sm font-semibold text-rose-100">
          Total favorites:{" "}
          {storageReady ? (
            favoriteIds.length
          ) : (
            <span className="inline-block w-4 animate-pulse rounded bg-rose-300/25 align-middle">
              &nbsp;
            </span>
          )}
        </div>
      </motion.div>

      {!storageReady || isLoading ? (
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={`favorite-skeleton-${index}`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <CocktailCardSkeleton />
            </motion.div>
          ))}
        </div>
      ) : null}

      {storageReady && !isLoading && orderedDrinks.length === 0 ? (
        <motion.div
          {...panelLiftMotion}
          transition={{ ...panelLiftMotion.transition, delay: 0.08 }}
          className="glass-panel rounded-2xl border-white/15 p-8 text-center"
        >
          <p className="mb-4 text-lg font-semibold text-slate-100">
            No favorites yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/40 bg-emerald-500/75 px-4 py-2 text-sm font-semibold text-white"
          >
            <Martini className="h-4 w-4" />
            Explore cocktails
          </Link>
        </motion.div>
      ) : null}

      {storageReady && !isLoading && orderedDrinks.length > 0 ? (
        <motion.div
          variants={containerMotion}
          initial="hidden"
          animate="visible"
          className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {orderedDrinks.map((drink, index) => (
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
                      onClick={() => removeFavorite(drink.id, drink.name)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-300/40 bg-rose-500/30 text-rose-100 backdrop-blur-sm"
                      aria-label={`Remove ${drink.name} from favorites`}
                    >
                      <Heart className="h-4 w-4 fill-rose-200" />
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
                  <div className="mt-auto pt-4">
                    <Link
                      href={`/cocktail/${drink.id}`}
                      className="inline-flex items-center rounded-lg border border-emerald-300/40 bg-emerald-500/70 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(16,185,129,0.45)] hover:bg-emerald-500"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.article>
          ))}
        </motion.div>
      ) : null}
    </section>
  );
}

"use client";

/**
 * Cocktail detail (client): hydrates from server initialCocktail; useSingleCocktailQuery can refetch if needed.
 * Favorite toggle writes through favorites-storage (localStorage).
 */
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeInfo,
  Beaker,
  Check,
  Copy,
  Layers3,
  ListChecks,
  Tags,
  Wine,
  Heart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSingleCocktailQuery } from "@/hooks/use-cocktails-query";
import { CocktailHeroMedia } from "@/components/ui/cocktail-card-media";
import { Badge } from "@/components/ui/badge";
import { RippleButton } from "@/components/ui/ripple-button";
import type { CocktailDetail } from "@/types/cocktail";
import { activityToast } from "@/lib/activity-toast";
import { getFavoriteIds, setFavoriteIds } from "@/lib/favorites-storage";

interface CocktailPageProps {
  id: string;
  initialCocktail: CocktailDetail | null;
}

export function CocktailPage({ id, initialCocktail }: CocktailPageProps) {
  const { data } = useSingleCocktailQuery(id, initialCocktail);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return getFavoriteIds();
  });
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);

  useEffect(() => {
    setFavoriteIds(favorites);
  }, [favorites]);

  function toggleFavorite(currentId: string, label: string) {
    setFavorites((prev) => {
      const exists = prev.includes(currentId);
      const next = exists
        ? prev.filter((item) => item !== currentId)
        : [...prev, currentId];
      activityToast({
        id: "favorites-activity",
        icon: (
          <Heart className={`h-4 w-4 ${exists ? "" : "fill-emerald-300"}`} />
        ),
        title: exists ? "Removed from favorites" : "Added to favorites",
        description: `${label} • Total favorites: ${next.length}`,
      });
      return next;
    });
  }

  async function copyTitle(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedTitle(true);
    activityToast({
      icon: <Copy className="h-4 w-4" />,
      title: "Title copied",
      description: `"${value}" copied to clipboard`,
    });
    setTimeout(() => setCopiedTitle(false), 1200);
  }

  async function copyDetails(cocktail: CocktailDetail) {
    const payload = [
      `Name: ${cocktail.name}`,
      `Category: ${cocktail.category}`,
      `Info: ${cocktail.info}`,
      `Glass: ${cocktail.glass}`,
      `Ingredients: ${cocktail.ingredients.join(", ")}`,
      `Instructions: ${cocktail.instructions}`,
    ].join("\n");
    await navigator.clipboard.writeText(payload);
    setCopiedDetails(true);
    activityToast({
      icon: <Copy className="h-4 w-4" />,
      title: "Details copied",
      description: "Cocktail details copied to clipboard",
    });
    setTimeout(() => setCopiedDetails(false), 1200);
  }

  if (!data) {
    return (
      <section className="mx-auto w-full max-w-9xl px-4 py-8 text-center sm:px-8">
        <h2 className="mb-4 text-2xl font-semibold text-slate-100">
          Cocktail not found
        </h2>
        <Link
          href="/"
          className="inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Back Home
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-8 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between gap-4"
      >
        <div className="inline-flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 font-heading">
            {data.name}
          </h1>
          <RippleButton
            type="button"
            onClick={() => copyTitle(data.name)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-slate-900/45 text-slate-100"
            aria-label="Copy cocktail name"
          >
            {copiedTitle ? (
              <Check className="h-4 w-4 text-emerald-200" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </RippleButton>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/40 bg-emerald-500/75 px-4 py-2 text-sm text-white shadow-[0_14px_28px_rgba(16,185,129,0.45)] hover:bg-emerald-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back Home
        </Link>
      </motion.div>

      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="glass-panel relative w-full overflow-hidden rounded-[24px] border-white/15">
            <CocktailHeroMedia
              src={data.image}
              alt={data.name}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute right-3 top-3 z-20">
              <RippleButton
                type="button"
                onClick={() => toggleFavorite(data.id, data.name)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-sm ${
                  favorites.includes(data.id)
                    ? "border-rose-300/40 bg-rose-500/30 text-rose-100"
                    : "border-white/25 bg-slate-900/50 text-slate-200 hover:bg-slate-800/70"
                }`}
                aria-label={`Toggle favorite for ${data.name}`}
              >
                <Heart
                  className={`h-4 w-4 ${favorites.includes(data.id) ? "fill-rose-200" : ""}`}
                />
              </RippleButton>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel space-y-4 rounded-[24px] border-white/15 p-6 text-base leading-relaxed text-slate-100"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-300">
              Cocktail details
            </p>
            <RippleButton
              type="button"
              onClick={() => copyDetails(data)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-slate-900/45 text-slate-100"
              aria-label="Copy cocktail details"
            >
              {copiedDetails ? (
                <Check className="h-4 w-4 text-emerald-200" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </RippleButton>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-400/25 text-emerald-100">
              <BadgeInfo className="mr-1 h-3.5 w-3.5" />
              {data.info}
            </Badge>
            <Badge className="bg-violet-400/25 text-violet-100">
              <Layers3 className="mr-1 h-3.5 w-3.5" />
              {data.category}
            </Badge>
            <Badge className="bg-cyan-400/25 text-cyan-100">
              <Wine className="mr-1 h-3.5 w-3.5" />
              {data.glass}
            </Badge>
            {data.iba ? (
              <Badge className="bg-amber-400/25 text-amber-100">
                <Beaker className="mr-1 h-3.5 w-3.5" />
                IBA: {data.iba}
              </Badge>
            ) : null}
            {data.alternateName ? (
              <Badge className="bg-slate-200/15 text-slate-100">
                Alt: {data.alternateName}
              </Badge>
            ) : null}
          </div>

          {data.tags.length > 0 ? (
            <div>
              <p className="mb-2 inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-slate-300">
                <Tags className="h-4 w-4" />
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-fuchsia-400/20 text-fuchsia-100"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-2 inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-slate-300">
              <ListChecks className="h-4 w-4" />
              Ingredients
            </p>
            <div className="flex flex-wrap gap-2">
              {data.ingredients.map((item) => (
                <Badge
                  key={item}
                  className="bg-emerald-400/20 text-emerald-100"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
              Instructions
            </p>
            <p className="leading-7 text-slate-100">{data.instructions}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

/**
 * Bridges TheCocktailDB fetches to TanStack Query. initialData hydrates from the server so the first client render matches SSR.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchCocktails, fetchSingleCocktail } from "@/lib/api";
import type { CocktailCardItem, CocktailDetail } from "@/types/cocktail";

export function useCocktailsQuery(
  searchTerm: string,
  initialData: CocktailCardItem[],
) {
  return useQuery({
    queryKey: ["cocktails", searchTerm || "a"],
    queryFn: () => fetchCocktails(searchTerm),
    initialData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useSingleCocktailQuery(
  id: string,
  initialData: CocktailDetail | null,
) {
  return useQuery({
    queryKey: ["cocktail", id],
    queryFn: () => fetchSingleCocktail(id),
    initialData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

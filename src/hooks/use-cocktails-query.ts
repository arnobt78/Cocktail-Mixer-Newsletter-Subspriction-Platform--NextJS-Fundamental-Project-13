"use client";

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
  });
}

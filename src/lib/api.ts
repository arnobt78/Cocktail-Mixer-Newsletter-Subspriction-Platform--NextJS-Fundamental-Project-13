import type {
  CocktailCardItem,
  CocktailDetail,
  CocktailLookupResponse,
  CocktailSearchResponse,
  DrinkApiItem,
} from "@/types/cocktail";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://www.thecocktaildb.com/api/json/v1/1";
const cocktailSearchUrl = `${apiBaseUrl}/search.php?s=`;
const singleCocktailUrl = `${apiBaseUrl}/lookup.php?i=`;

function toCardItem(item: DrinkApiItem): CocktailCardItem {
  return {
    id: item.idDrink,
    name: item.strDrink,
    image: item.strDrinkThumb,
    info: item.strAlcoholic,
    glass: item.strGlass,
    category: item.strCategory,
  };
}

function toDetail(item: DrinkApiItem): CocktailDetail {
  const ingredients = Object.keys(item)
    .filter((key) => key.startsWith("strIngredient"))
    .map((key) => item[key as keyof DrinkApiItem])
    .filter((value): value is string => Boolean(value));
  const tags = item.strTags
    ? item.strTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  return {
    id: item.idDrink,
    name: item.strDrink,
    image: item.strDrinkThumb,
    info: item.strAlcoholic,
    category: item.strCategory,
    glass: item.strGlass,
    instructions: item.strInstructions,
    ingredients,
    iba: item.strIBA ?? null,
    tags,
    alternateName: item.strDrinkAlternate ?? null,
  };
}

export async function fetchCocktails(searchTerm: string): Promise<CocktailCardItem[]> {
  const term = searchTerm.trim() || "a";
  const response = await fetch(`${cocktailSearchUrl}${encodeURIComponent(term)}`, {
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cocktails");
  }

  const data = (await response.json()) as CocktailSearchResponse;
  return (data.drinks ?? []).map(toCardItem);
}

export async function fetchSingleCocktail(id: string): Promise<CocktailDetail | null> {
  const response = await fetch(`${singleCocktailUrl}${encodeURIComponent(id)}`, {
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cocktail details");
  }

  const data = (await response.json()) as CocktailLookupResponse;
  const first = data.drinks?.[0];
  if (!first) {
    return null;
  }
  return toDetail(first);
}

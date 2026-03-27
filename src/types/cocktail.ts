export interface DrinkApiItem {
  idDrink: string;
  strDrink: string;
  strDrinkThumb: string;
  strAlcoholic: string;
  strGlass: string;
  strCategory: string;
  strInstructions: string;
  strIBA?: string | null;
  strTags?: string | null;
  strDrinkAlternate?: string | null;
  [key: `strIngredient${number}`]: string | null | undefined;
}

export interface CocktailSearchResponse {
  drinks: DrinkApiItem[] | null;
}

export interface CocktailLookupResponse {
  drinks: DrinkApiItem[] | null;
}

export interface CocktailCardItem {
  id: string;
  name: string;
  image: string;
  info: string;
  glass: string;
  category: string;
}

export interface CocktailDetail {
  id: string;
  name: string;
  image: string;
  info: string;
  category: string;
  glass: string;
  instructions: string;
  ingredients: string[];
  iba: string | null;
  tags: string[];
  alternateName: string | null;
}

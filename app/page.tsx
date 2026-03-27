import { HomePage } from "@/components/pages/HomePage";
import { fetchCocktails } from "@/lib/api";

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const rawSearch = params.search;
  const searchTerm = Array.isArray(rawSearch) ? rawSearch[0] ?? "" : rawSearch ?? "";
  const initialDrinks = await fetchCocktails(searchTerm);

  return <HomePage initialDrinks={initialDrinks} initialSearchTerm={searchTerm} />;
}

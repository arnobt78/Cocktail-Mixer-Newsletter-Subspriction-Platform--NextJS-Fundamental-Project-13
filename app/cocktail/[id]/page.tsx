import { notFound } from "next/navigation";
import { CocktailPage } from "@/components/pages/CocktailPage";
import { fetchSingleCocktail } from "@/lib/api";

interface CocktailProps {
  params: Promise<{ id: string }>;
}

export default async function Cocktail({ params }: CocktailProps) {
  const resolvedParams = await params;
  const initialCocktail = await fetchSingleCocktail(resolvedParams.id);

  if (!initialCocktail) {
    notFound();
  }

  return <CocktailPage id={resolvedParams.id} initialCocktail={initialCocktail} />;
}

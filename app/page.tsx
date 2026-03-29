/**
 * Home route: Server Component. Reads ?search= from the URL, fetches cocktails on the
 * server for fast first paint, then passes results into the client HomePage for interactivity.
 */
import type { Metadata } from "next";
import { HomePage } from "@/components/pages/HomePage";
import { fetchCocktails } from "@/lib/api";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://cocktails-newsletter.vercel.app";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl },
};

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const rawSearch = params.search;
  // Next 15+ passes searchParams as a Promise in this project’s typing—normalize to a string.
  const searchTerm = Array.isArray(rawSearch) ? rawSearch[0] ?? "" : rawSearch ?? "";
  const initialDrinks = await fetchCocktails(searchTerm);

  return <HomePage initialDrinks={initialDrinks} initialSearchTerm={searchTerm} />;
}

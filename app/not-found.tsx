/**
 * Global 404 UI when notFound() is thrown or no route matches.
 */
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-9xl flex-col items-center px-4 py-12 text-center sm:px-8">
      <div className="relative mb-8 h-72 w-full max-w-xl">
        <SafeImage
          src="/not-found.svg"
          alt="Not found"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 40vw"
        />
      </div>
      <h1 className="mb-3 text-4xl font-bold text-slate-900 font-heading">Ohh!</h1>
      <p className="mb-6 text-slate-700">
        We can&apos;t seem to find the page you are looking for.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
      >
        Back home
      </Link>
    </section>
  );
}

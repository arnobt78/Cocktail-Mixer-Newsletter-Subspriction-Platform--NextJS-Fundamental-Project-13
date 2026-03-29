/**
 * Root layout (App Router): wraps every page. Defines global SEO metadata, JSON-LD,
 * fonts, and providers (TanStack Query + newsletter context + shell + toasts).
 * Child routes render inside {children} via nested layouts where present.
 */
import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AppShell } from "@/components/layout/app-shell";
import { NewsletterProvider } from "@/context/newsletter-context";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  // CSS variable name is historical; font family is Manrope (see tailwind.config heading font).
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

// metadataBase + absolute OG URLs: use real production URL on Vercel (NEXT_PUBLIC_APP_URL).
const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://cocktails-newsletter.vercel.app";

const brandTitle = process.env.NEXT_PUBLIC_APP_TITLE?.trim() || "MixMaster";

const defaultDocumentTitle = `${brandTitle} — Cocktail Recipes, Search, TheCocktailDB & Newsletter`;

const siteDescription =
  "Discover cocktail recipes with TheCocktailDB: search by name, view ingredients and instructions, save favorites, and subscribe via a double opt-in newsletter. Built with Next.js, React, TypeScript, and Tailwind CSS. Educational project by Arnob Mahmud.";

const siteKeywords = [
  "MixMaster",
  "cocktails",
  "cocktail recipes",
  "TheCocktailDB",
  "drink recipes",
  "bartending",
  "newsletter",
  "double opt-in",
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Framer Motion",
  "TanStack Query",
  "Resend",
  "Upstash Redis",
  "Arnob Mahmud",
  "web development",
  "educational project",
] as const;

// Next merges this with route-level metadata (e.g. app/page.tsx canonical).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultDocumentTitle,
    // e.g. export const metadata = { title: "About" } → "About | MixMaster"
    template: `%s | ${brandTitle}`,
  },
  description: siteDescription,
  keywords: [...siteKeywords],
  applicationName: brandTitle,
  authors: [{ name: "Arnob Mahmud", url: "https://www.arnobmahmud.com" }],
  creator: "Arnob Mahmud",
  publisher: "Arnob Mahmud",
  category: "food & drink",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: brandTitle,
    title: defaultDocumentTitle,
    description: siteDescription,
    images: [
      {
        url: "/favicon.ico",
        alt: `${brandTitle} icon`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: defaultDocumentTitle,
    description: siteDescription,
    images: ["/favicon.ico"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Structured data for search engines (WebSite + author); complements <meta> tags above.
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: brandTitle,
  description: siteDescription,
  url: siteUrl,
  inLanguage: "en",
  author: {
    "@type": "Person",
    name: "Arnob Mahmud",
    url: "https://www.arnobmahmud.com",
    email: "contact@arnobmahmud.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${dmSans.variable} ${manrope.variable} font-body antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <QueryProvider>
          <NewsletterProvider>
            <div className="app-shell">
              <AppShell>{children}</AppShell>
            </div>
            <Toaster
              position="bottom-right"
              closeButton
              richColors
              toastOptions={{
                className: "bg-transparent border-none shadow-none p-0",
              }}
            />
          </NewsletterProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

import type { MetadataRoute } from "next";

/**
 * Crawl policy: allow marketing pages, block /api and build assets. /cocktail/ disallowed to limit bot churn on IDs.
 * Second rule blocks common AI crawlers site-wide (see also Vercel firewall docs).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/_next/", "/api/", "/cocktail/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
        ],
        disallow: "/",
      },
    ],
  };
}

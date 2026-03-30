# Cocktail Mixer & Newsletter Platform – Next.js, React, TypeScript, CocktailDB API, Tailwind CSS, Framer Motion Fundamental Project 13 (including Admin Control Room)

A full-stack, educational cocktail discovery app built with the **Next.js App Router**, **React**, and **TypeScript**. It combines public pages (search, cocktail details, favorites, newsletter signup) with a production-style **newsletter pipeline** (double opt-in, unsubscribe, rate limits) and an **Admin Control Room** for campaigns, subscribers, AI-assisted drafting, and live API diagnostics. Data flows from **TheCocktailDB** API and optional **Upstash Redis** + **Resend** for email and storage—so you can run a minimal UI-only mode or a complete “mini product” locally or on Vercel.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5.74-ff4154)](https://tanstack.com/query/latest)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-0055ff)](https://www.framer.com/motion/)
[![Resend](https://img.shields.io/badge/Resend-6.9.4-0055ff)](https://resend.com/)
[![Upstash Redis](https://img.shields.io/badge/Upstash%20Redis-1.37.0-0055ff)](https://upstash.com/)

- **Live Demo:** [https://cocktails-newsletter.vercel.app](https://cocktails-newsletter.vercel.app)

![Image 1](https://github.com/user-attachments/assets/d72d64bb-29a2-4f0c-b415-5e8e1d438bc6)
![Image 2](https://github.com/user-attachments/assets/3977a7c1-20ce-4baa-86c3-322b82fad9e4)
![Image 3](https://github.com/user-attachments/assets/375a894e-1886-483f-8981-6b768ec95626)
![Image 4](https://github.com/user-attachments/assets/d2bfcbb3-f90b-4d4c-a739-ba35720e0013)
![Image 5](https://github.com/user-attachments/assets/5595b55d-6d06-47de-bb6e-bdbe1a906555)
![Image 6](https://github.com/user-attachments/assets/7a972221-8386-4cbd-907e-674cf433893a)
![Image 7](https://github.com/user-attachments/assets/c5009a0c-e45a-455d-989c-96af14b6ce17)
![Image 8](https://github.com/user-attachments/assets/886e2e75-cf89-4753-9720-695518bf31da)
![Image 9](https://github.com/user-attachments/assets/7308e76f-d69c-43c5-8869-ad6b857ddefd)
![Image 10](https://github.com/user-attachments/assets/f0d92887-489a-4c79-9113-1b616595136a)

## Table of Contents

- [What You Will Learn](#what-you-will-learn)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Keywords](#keywords)
- [Prerequisites](#prerequisites)
- [Installation & Quick Start](#installation--quick-start)
- [Environment Variables](#environment-variables)
- [NPM Scripts](#npm-scripts)
- [Project Structure](#project-structure)
- [Routing & Pages](#routing--pages)
- [API Routes & Backend](#api-routes--backend)
- [Admin Control Room](#admin-control-room)
- [How Key Features Work](#how-key-features-work)
- [Reusing Components in Other Projects](#reusing-components-in-other-projects)
- [Testing](#testing)
- [Deployment (Vercel)](#deployment-vercel)
- [Further Reading](#further-reading)
- [Contributing](#contributing)
- [Conclusion](#conclusion)
- [License](#license)
- [Happy Coding](#happy-coding-)

---

## What You Will Learn

- **Next.js App Router**: file-based routes, layouts, server components vs client components, loading and not-found UI.
- **Data fetching**: server-side fetch for first paint (e.g. home search), client-side TanStack Query for interactive lists.
- **TypeScript**: shared types for cocktails, newsletter payloads, and admin APIs.
- **Newsletter flows**: subscribe → confirmation email → double opt-in → unsubscribe with signed tokens.
- **Admin patterns**: passkey login, httpOnly session cookie, protected API routes, CSV export, broadcast composer.
- **Real integrations**: TheCocktailDB, optional Resend + Upstash Redis, optional AI providers (Groq, Gemini, OpenRouter).
- **Quality tooling**: ESLint, Vitest, Playwright smoke tests, SEO metadata and `robots.ts`.

---

## Features

| Area                   | What it does                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Home**               | Search cocktails by name via TheCocktailDB; SSR-friendly initial data with URL `?search=` support. |
| **Cocktail detail**    | Dynamic route `/cocktail/[id]` with ingredients, instructions, and safe image handling.            |
| **Favorites**          | Client-side persistence (localStorage) with hydration-safe patterns.                               |
| **About**              | Static marketing/educational copy from shared content modules.                                     |
| **Newsletter**         | Public signup; confirm and unsubscribe pages; rate limiting on API routes.                         |
| **Admin overview**     | Dashboard summary (counts, health hints) when Redis/session are configured.                        |
| **Broadcast composer** | Drafts, queue, history, test send, schedule, resend, optional AI fill.                             |
| **Subscribers**        | Admin CRUD-style management for subscriber records (with auth).                                    |
| **API docs (in-app)**  | Human-readable catalog of HTTP routes from `project-api-registry.ts`.                              |
| **API status**         | Live browser + server probes, TheCocktailDB latency, integration flags.                            |

---

## Technology Stack

| Layer                    | Libraries / Tools                                                      | Role                                                             |
| ------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Framework**            | Next.js 16, React 19                                                   | App Router, RSC, routing, metadata API.                          |
| **Language**             | TypeScript 5.8                                                         | Types for components, API bodies, and domain models.             |
| **Styling**              | Tailwind CSS 3.4, `tailwind-merge`, `clsx`, `class-variance-authority` | Utility-first UI, conditional classes, variant-based components. |
| **Motion**               | Framer Motion 12                                                       | Page and micro-interactions (e.g. admin dialogs).                |
| **Server / client data** | TanStack Query 5                                                       | Caching, mutations, devtools for client fetches.                 |
| **UI primitives**        | Radix Tabs & Tooltip                                                   | Accessible tabs and tooltips in admin UI.                        |
| **Icons**                | Lucide React                                                           | Consistent icon set.                                             |
| **Toasts**               | Sonner, react-hot-toast                                                | User feedback (activity vs legacy paths).                        |
| **Email**                | Resend                                                                 | Transactional and broadcast email.                               |
| **Data store**           | Upstash Redis                                                          | Subscribers, drafts, queue, history (when configured).           |
| **AI (optional)**        | Groq / Gemini / OpenRouter HTTP APIs                                   | Composer assist with ordered fallback.                           |
| **Testing**              | Vitest, Playwright                                                     | Unit tests for newsletter handlers; smoke E2E for home/about.    |
| **Lint**                 | ESLint 9 + eslint-config-next                                          | Project-wide lint (`npm run lint`).                              |

**Example — why TanStack Query?** It deduplicates requests, gives you `isPending` / `isError` for UI, and keeps server state in sync after mutations (e.g. after saving a draft you can invalidate summary queries).

```tsx
// Conceptual pattern used in admin/client components:
const { data, isPending } = useQuery({
  queryKey: ["admin-summary"],
  queryFn: () =>
    fetch("/api/admin/control-room/summary", { credentials: "include" }).then(
      (r) => r.json(),
    ),
});
```

---

## Keywords

Next.js, React, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, TheCocktailDB, cocktail recipes, newsletter, double opt-in, Resend, Upstash Redis, App Router, server components, educational project, full-stack, admin dashboard, API routes, rate limiting, MIT License, Arnob Mahmud, MixMaster, Vercel, Playwright, Vitest, SEO, accessibility.

---

## Prerequisites

- **Node.js** 18+ (20+ recommended for current Next.js toolchains).
- **npm** (or pnpm/yarn if you adjust commands).

---

## Installation & Quick Start

```bash
git clone <your-fork-or-repo-url>
cd 09-mixmaster
npm install
cp .env.example .env   # optional but recommended; see Environment Variables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Minimal run (UI + TheCocktailDB only):** You can start with _no_ `.env` if defaults are enough for public pages; `NEXT_PUBLIC_API_BASE_URL` defaults to TheCocktailDB in code paths that read it. Newsletter and admin features need the variables below.

---

## Environment Variables

Copy **`.env.example`** → **`.env`**. Nothing is committed from `.env` (see `.gitignore`).

### Tier 0 — Optional branding & URLs

| Variable                   | Purpose                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_TITLE`    | Browser title / brand string (default: MixMaster).                                                 |
| `NEXT_PUBLIC_APP_URL`      | **Required for production** emails and broadcast links—set to your real `https://…` URL on Vercel. |
| `NEXT_PUBLIC_API_BASE_URL` | TheCocktailDB JSON base (has a sensible default).                                                  |

### Tier 1 — Newsletter (Resend + Redis)

| Variable                        | Purpose                                            |
| ------------------------------- | -------------------------------------------------- |
| `RESEND_API_KEY`                | Send mail via Resend.                              |
| `RESEND_FROM_EMAIL`             | From address (must be allowed in Resend).          |
| `RESEND_REPLY_TO_EMAIL`         | Reply-To header.                                   |
| `UPSTASH_REDIS_REST_URL`        | Upstash REST URL.                                  |
| `UPSTASH_REDIS_REST_TOKEN`      | Upstash token.                                     |
| `NEWSLETTER_UNSUBSCRIBE_SECRET` | Sign unsubscribe links (use a long random string). |
| `NEWSLETTER_CONFIRM_SECRET`     | Optional separate secret for confirm links.        |

### Tier 2 — Admin & security

| Variable               | Purpose                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `ADMIN_DASHBOARD_KEY`  | **6-digit passkey** the admin UI sends to `/api/admin/session/login` (must match exactly what you type). |
| `ADMIN_SESSION_SECRET` | Secret material used to sign the admin session cookie.                                                   |
| `CRON_DIGEST_SECRET`   | Protects `POST /api/newsletter/weekly-brief` (e.g. cron jobs send header matching this).                 |

### Tier 3 — AI composer assist (optional)

| Variable                                | Purpose                |
| --------------------------------------- | ---------------------- |
| `GROQ_API_KEY`                          | First-choice provider. |
| `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` | Second choice.         |
| `OPENROUTER_API_KEY`                    | Third choice.          |

**How to obtain keys (high level):**

1. **Resend** — Create an API key at [resend.com](https://resend.com); verify a domain or use onboarding domain for tests.
2. **Upstash** — Create a Redis database; copy REST URL + token from the console.
3. **Secrets** — Generate random strings (e.g. `openssl rand -hex 32`) for `NEWSLETTER_*`, `ADMIN_SESSION_SECRET`, `CRON_DIGEST_SECRET`.
4. **AI** — Create keys in Groq / Google AI Studio / OpenRouter dashboards as needed.

---

## NPM Scripts

| Script              | Command            | Description                                                              |
| ------------------- | ------------------ | ------------------------------------------------------------------------ |
| Dev server          | `npm run dev`      | Next.js dev (Turbopack).                                                 |
| Production build    | `npm run build`    | Optimized build.                                                         |
| Start (after build) | `npm run start`    | Run production server locally.                                           |
| Lint                | `npm run lint`     | ESLint over the repo.                                                    |
| Unit tests          | `npm run test`     | Vitest.                                                                  |
| E2E smoke           | `npm run test:e2e` | Playwright (see `playwright.config.ts`; dev server on `:3000` or reuse). |

---

## Project Structure

High-level map (see repo for full tree):

```text
app/                    # App Router: pages, layouts, route handlers
  admin/control-room/   # Admin UI routes (composer, subscribers, api-docs, api-status, …)
  api/                  # REST handlers (newsletter, admin, control-room, …)
  cocktail/[id]/        # Dynamic cocktail page
  newsletter/           # Signup + confirm + unsubscribe flows
  layout.tsx            # Root layout, providers, global metadata & JSON-LD
  page.tsx              # Home (search)
  robots.ts             # Crawl rules + AI bot disallow list
src/
  components/           # UI: pages/, layout/, admin/, ui/
  context/              # React context (e.g. newsletter)
  data/                 # Static copy + API documentation registry
  hooks/                # TanStack Query hooks, media query, etc.
  lib/                  # api.ts, newsletter/*, admin-*, favorites, utils
  providers/            # QueryClient provider
  types/                # cocktail.ts, newsletter.ts, admin.ts
public/                 # Static assets (favicon, illustrations)
tests/                  # Vitest tests
e2e/                    # Playwright specs
docs/                   # Extra guides (e.g. Vercel guardrails)
```

**Convention:** Route **UI** often lives under `app/*/page.tsx` and imports **presentational/feature** components from `src/components/pages/*` or `src/components/admin/*`. **Business logic** for mail and Redis sits in `src/lib/newsletter/*`.

---

## Routing & Pages

| Path                              | Description                              |
| --------------------------------- | ---------------------------------------- |
| `/`                               | Home: cocktail search and listing.       |
| `/about`                          | About / learning copy.                   |
| `/favorites`                      | Saved cocktails (local).                 |
| `/newsletter`                     | Signup UI.                               |
| `/newsletter/confirm`             | Confirm subscription (token from email). |
| `/newsletter/unsubscribe`         | Unsubscribe UI.                          |
| `/cocktail/[id]`                  | Single cocktail detail.                  |
| `/admin/control-room`             | Admin shell (requires session).          |
| `/admin/control-room/composer`    | Broadcast composer.                      |
| `/admin/control-room/subscribers` | Subscriber admin.                        |
| `/admin/control-room/explore`     | Explore / tools area.                    |
| `/admin/control-room/api-docs`    | In-app HTTP API documentation.           |
| `/admin/control-room/api-status`  | Live status dashboard.                   |

---

## API Routes & Backend

All HTTP APIs live under `app/api/**/route.ts`. Auth uses **`assertAdminSession`** or cookie verification for admin routes; public newsletter routes use validation + rate limits.

**Groups (see also in-app API docs):**

- **Newsletter (public):** `POST /api/newsletter`, `POST /api/newsletter/confirm`, `POST /api/newsletter/unsubscribe`, `POST /api/newsletter/weekly-brief` (cron secret).
- **Admin session:** `POST /api/admin/session/login`, `POST /api/admin/session/logout`.
- **Control room:** summary, drafts, save-draft, send-post, queue, history, process-queue, resend-post, export, diagnostics.
- **Subscribers & AI:** `GET/PATCH/DELETE /api/admin/subscribers`, `POST /api/admin/ai/composer-assist`.

**Single source of truth for documentation strings:** `src/data/project-api-registry.ts` (`PROJECT_API_DOC_GROUPS`).

**Example — newsletter subscribe (conceptual):**

```http
POST /api/newsletter
Content-Type: application/json

{ "email": "learner@example.com", "fullName": "Ada" }
```

The handler validates input, applies rate limits, and (when configured) queues a confirmation email via Resend.

---

## Admin Control Room

1. Visit **`/admin/control-room`** (or any nested admin path).
2. Enter the **6-digit passkey** that matches **`ADMIN_DASHBOARD_KEY`** in your `.env`.
3. For **local learning**, you can set:

   ```env
   ADMIN_DASHBOARD_KEY=112233
   ```

   and log in with passkey **`112233`** (demo only—use a strong random value in production).

Without `ADMIN_DASHBOARD_KEY`, the UI explains that the control room is disabled. Other admin features (subscribers, sends) also require Redis/Resend when those code paths persist or send mail.

---

## How Key Features Work

### TheCocktailDB integration

`src/lib/api.ts` builds URLs from `NEXT_PUBLIC_API_BASE_URL` (default TheCocktailDB). Server components or route handlers can call `fetchCocktails` / related helpers for SSR.

### Favorites

`src/lib/favorites-storage.ts` wraps `localStorage` with guards so SSR and client renders do not mismatch (read after mount, sync events).

### Newsletter security

`src/lib/newsletter/security.ts` and related modules sign links with secrets so confirm/unsubscribe URLs cannot be forged without the server keys.

### Broadcast pipeline

Composer saves drafts to Redis, can queue scheduled sends, and uses `broadcast-dispatch` / mailer code paths. **Always set `NEXT_PUBLIC_APP_URL`** in production so links inside emails point to your real domain.

### SEO

`app/layout.tsx` exports rich `metadata` (Open Graph, Twitter, keywords, authors). `app/page.tsx` sets a canonical URL for the home page. `app/robots.ts` scopes crawlers and blocks common AI user-agents from `/`.

---

## Reusing Components in Other Projects

| Piece                    | File(s)                               | Reuse idea                                                          |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------- |
| **Safe image**           | `src/components/ui/safe-image.tsx`    | Drop-in Next/Image wrapper with fallbacks for broken cocktail URLs. |
| **Ripple button**        | `src/components/ui/ripple-button.tsx` | Accessible button with feedback animation.                          |
| **Card / Badge / Input** | `src/components/ui/*`                 | Copy into another Tailwind + CVA project.                           |
| **Query provider**       | `src/providers/query-provider.tsx`    | Standard TanStack Query + Devtools wiring.                          |
| **Newsletter context**   | `src/context/newsletter-context.tsx`  | Pattern for client-side signup state + toasts.                      |
| **API registry pattern** | `src/data/project-api-registry.ts`    | Document your own APIs in one typed array and render docs in-app.   |

When porting, replace **imports** (`@/…`) with your alias or relative paths and align **Tailwind theme** (`tailwind.config.ts`) with your design tokens.

---

## Testing

- **Vitest:** `tests/newsletter-routes.test.ts` exercises newsletter route behavior with mocks.
- **Playwright:** `e2e/smoke.spec.ts` loads `/` and `/about` (run `npm run dev` in another terminal or rely on `reuseExistingServer` in config).

```bash
npm run test
npm run test:e2e
```

---

## Deployment (Vercel)

1. Connect the Git repository to Vercel.
2. Set **all required environment variables** in the project settings (especially `NEXT_PUBLIC_APP_URL` for production).
3. Deploy; verify newsletter and admin flows on the preview/production URL.
4. Optional: enable firewall / bot settings per `docs/VERCEL_PRODUCTION_GUARDRAILS.md`.

---

## Further Reading

- In-repo: `docs/VERCEL_PRODUCTION_GUARDRAILS.md`, `docs/UI_STYLING_GUIDE.md`, and other `docs/*` guides.
- [Next.js Documentation](https://nextjs.org/docs)
- [TheCocktailDB API](https://www.thecocktaildb.com/api.php)
- [TanStack Query](https://tanstack.com/query/latest)
- [Resend Docs](https://resend.com/docs)
- [Upstash Redis REST](https://upstash.com/docs/redis)

---

## Contributing

Issues and pull requests are welcome: bug fixes, documentation improvements, and small focused features. Please keep changes easy to review and run `npm run lint` / `npm run build` before submitting.

---

## Conclusion

**MixMaster** is both a usable cocktail explorer and a structured learning lab for modern full-stack patterns—SSR + client state, typed APIs, email flows, and a gated admin surface. Use the demo, clone the repo, toggle environment tiers from “UI only” to “full newsletter + admin,” and adapt the components and `lib/` modules into your own projects.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute the code as per the terms of the license.

---

## Happy Coding! 🎉

This is an **open-source project** - feel free to use, enhance, and extend this project further!

If you have any questions or want to share your work, reach out via GitHub or my portfolio at [https://www.arnobmahmud.com](https://www.arnobmahmud.com).

**Enjoy building and learning!** 🚀

Thank you! 😊

---

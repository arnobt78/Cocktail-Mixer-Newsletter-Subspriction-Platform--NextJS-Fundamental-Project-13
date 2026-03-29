/** Central copy for About page and similar marketing surfaces—keeps prose out of JSX. */
export const aboutText =
  'MixMaster is a learning-focused cocktail platform built with modern Next.js and TypeScript. It combines SSR data loading, rich client interactions, reusable UI components, and a production-style newsletter pipeline. Learners can explore real API integrations, safe image rendering, state synchronization, optimistic UI patterns, and admin-driven communication workflows in one cohesive project.';

export const beginnerTips = [
  "SSR route handlers keep first paint fast while interactive logic stays in client components.",
  "Typed API models make refactors safer and document real request/response contracts.",
  "Favorites use hydration-safe local storage patterns with cross-component sync.",
  "Reusable UI primitives (card, badge, input, ripple button) keep styles consistent.",
  "Newsletter flow includes double opt-in confirmation and one-click unsubscribe security.",
  "Admin Control Room supports campaign composer, audience targeting, scheduling, and CSV export.",
  "Retry + dead-letter handling protects outbound mail flow from transient provider failures.",
  "Rate limits, session guards, and signed links model real production safety basics.",
];

export const featureHighlights = [
  {
    title: "Modern App Architecture",
    description:
      "App Router SSR pages, client-side feature modules, and strict TypeScript boundaries.",
  },
  {
    title: "Professional Newsletter Stack",
    description:
      "Resend + Upstash integration with confirmation links, queue processing, and campaign history.",
  },
  {
    title: "Admin Campaign Console",
    description:
      "Secure passkey session, draft workflows, test sends, audience filters, and scheduled delivery.",
  },
  {
    title: "UX and Performance Focus",
    description:
      "Stable skeleton sizing, responsive glass UI, reusable toasts, and predictable loading behavior.",
  },
];

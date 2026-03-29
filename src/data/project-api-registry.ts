export type ApiDocEndpoint = {
  path: string;
  methods: readonly string[];
  summary: string;
  auth: "public" | "admin-session";
  request?: string;
  response?: string;
  notes?: string;
};

export type ApiDocGroup = {
  id: string;
  label: string;
  endpoints: readonly ApiDocEndpoint[];
};

export const PROJECT_API_DOC_GROUPS: readonly ApiDocGroup[] = [
  {
    id: "public-newsletter",
    label: "Newsletter (public)",
    endpoints: [
      {
        path: "/api/newsletter",
        methods: ["POST"],
        summary: "Subscribe: validates payload, rate-limits, queues confirmation email.",
        auth: "public",
        request:
          "JSON `{ email, fullName }` — email required; name optional for personalization.",
        response: "JSON `{ ok, message }` — 200 success, 400 validation, 429 rate limit.",
      },
      {
        path: "/api/newsletter/confirm",
        methods: ["POST"],
        summary: "Confirm double opt-in using signed query params forwarded as JSON body.",
        auth: "public",
        request: "JSON with `email` + `token` from confirmation link.",
        response: "JSON `{ ok, message }` — activates subscriber, clears prior unsubscribe.",
      },
      {
        path: "/api/newsletter/unsubscribe",
        methods: ["POST"],
        summary: "Unsubscribe with token; optional reason / feedback fields.",
        auth: "public",
        request: "JSON with `email`, `token`, optional `reason`, `feedback`.",
        response: "JSON `{ ok, message }` — sets `unsubscribedAt` on subscriber record.",
      },
      {
        path: "/api/newsletter/weekly-brief",
        methods: ["POST"],
        summary: "Cron-style weekly send; protected by secret header in production.",
        auth: "public",
        request: "JSON or empty; requires `x-cron-secret` matching `CRON_DIGEST_SECRET`.",
        response: "JSON `{ ok, message, sent? }` broadcast summary.",
        notes: "Not intended for browser calls; documented for ops.",
      },
    ],
  },
  {
    id: "admin-session",
    label: "Admin session",
    endpoints: [
      {
        path: "/api/admin/session/login",
        methods: ["POST"],
        summary: "Validates `ADMIN_DASHBOARD_KEY`, sets httpOnly session cookie.",
        auth: "public",
        request: "JSON `{ password }` matching env secret.",
        response: "JSON `{ ok, message }` — Set-Cookie on success.",
      },
      {
        path: "/api/admin/session/logout",
        methods: ["POST"],
        summary: "Clears admin session cookie.",
        auth: "admin-session",
        response: "Redirect or JSON per handler implementation.",
      },
    ],
  },
  {
    id: "control-room",
    label: "Control room",
    endpoints: [
      {
        path: "/api/admin/control-room/summary",
        methods: ["GET"],
        summary: "Aggregated counts, lists, unsubscribe reasons for dashboard.",
        auth: "admin-session",
        response: "JSON control-room summary shape.",
      },
      {
        path: "/api/admin/control-room/drafts",
        methods: ["PATCH", "DELETE"],
        summary: "Update draft fields or delete one / clear all drafts.",
        auth: "admin-session",
        request: "PATCH JSON draft payload; DELETE optional `?id=` or clear all.",
        response: "JSON `{ ok, message, draft? }`.",
      },
      {
        path: "/api/admin/control-room/save-draft",
        methods: ["POST"],
        summary: "Create or overwrite composer draft from form payload.",
        auth: "admin-session",
        request: "JSON broadcast draft fields.",
        response: "JSON `{ ok, message }` + draft id when created.",
      },
      {
        path: "/api/admin/control-room/send-post",
        methods: ["POST"],
        summary: "Send broadcast now or schedule; audience + HTML body.",
        auth: "admin-session",
        request: "JSON composer payload + optional schedule ISO.",
        response: "JSON `{ ok, message, … }` dispatch result.",
      },
      {
        path: "/api/admin/control-room/process-queue",
        methods: ["POST"],
        summary: "Process due queued sends (scheduled time ≤ now).",
        auth: "admin-session",
        response: "JSON `{ ok, message, processed }`.",
      },
      {
        path: "/api/admin/control-room/queue",
        methods: ["GET", "PATCH", "DELETE"],
        summary: "List queue, update queued item, delete one or all.",
        auth: "admin-session",
        request: "PATCH JSON for edits; DELETE `?id=` or clear all.",
        response: "JSON queue array or operation result.",
      },
      {
        path: "/api/admin/control-room/history",
        methods: ["DELETE"],
        summary: "Delete one history row or clear resend history.",
        auth: "admin-session",
        request: "Query `?id=` for single delete, else clear all.",
        response: "JSON `{ ok, message }`.",
      },
      {
        path: "/api/admin/control-room/resend-post",
        methods: ["POST"],
        summary: "Resend from draft or history id.",
        auth: "admin-session",
        request: "JSON `{ id, source: 'draft' | 'history' }` (shape per route).",
        response: "JSON `{ ok, message, sent? }`.",
      },
      {
        path: "/api/admin/control-room/export",
        methods: ["GET"],
        summary: "Download active subscribers as CSV attachment.",
        auth: "admin-session",
        response: "text/csv file download.",
      },
      {
        path: "/api/admin/control-room/diagnostics",
        methods: ["GET"],
        summary: "Server-side latency check to TheCocktailDB + timestamp (this project).",
        auth: "admin-session",
        response:
          "JSON `{ ok, generatedAt, cocktailDb, runtime: { nodeEnv, cocktailDbHost, integrations }, serverProbes[] }`.",
      },
    ],
  },
  {
    id: "subscribers-ai",
    label: "Subscribers & AI",
    endpoints: [
      {
        path: "/api/admin/subscribers",
        methods: ["GET", "PATCH", "DELETE"],
        summary: "List subscribers, update metadata, or remove by id / criteria.",
        auth: "admin-session",
        request: "PATCH/DELETE JSON per admin subscribers UI.",
        response: "JSON list or `{ ok, message }`.",
      },
      {
        path: "/api/admin/ai/composer-assist",
        methods: ["POST"],
        summary: "AI-assisted subject/preheader/body from brief (optional provider).",
        auth: "admin-session",
        request: "JSON `{ brief }` or composer-assist payload.",
        response: "JSON filled fields or fallback message.",
      },
    ],
  },
  {
    id: "external",
    label: "External (TheCocktailDB)",
    endpoints: [
      {
        path: "{API_BASE}/search.php?s={term}",
        methods: ["GET"],
        summary: "Server-side cocktail search used by home / listing pages.",
        auth: "public",
        response: "JSON `{ drinks: Drink[] | null }`.",
        notes:
          "`API_BASE` = `NEXT_PUBLIC_API_BASE_URL` or default `…/api/json/v1/1`. See `src/lib/api.ts`.",
      },
      {
        path: "{API_BASE}/lookup.php?i={idDrink}",
        methods: ["GET"],
        summary: "Single drink detail for cocktail detail route.",
        auth: "public",
        response: "JSON `{ drinks: [Drink] | null }`.",
      },
    ],
  },
] as const;

export type BrowserProbeRoute = {
  path: string;
  method: "GET" | "HEAD";
  label: string;
};

/** Routes probed from the browser (admin routes use `credentials: include`). */
export const BROWSER_PROBE_ROUTES: readonly BrowserProbeRoute[] = [
  { path: "/api/admin/control-room/summary", method: "GET", label: "Control room summary" },
  { path: "/api/admin/subscribers", method: "GET", label: "Subscribers" },
  { path: "/api/admin/control-room/queue", method: "GET", label: "Broadcast queue" },
  { path: "/robots.txt", method: "GET", label: "Robots.txt" },
  { path: "/", method: "HEAD", label: "Home page" },
  { path: "/about", method: "HEAD", label: "About page" },
  { path: "/favorites", method: "HEAD", label: "Favorites page" },
  { path: "/newsletter", method: "HEAD", label: "Newsletter signup page" },
] as const;

export type ServerDiagnosticsProbeRoute = {
  path: string;
  method: "GET" | "HEAD";
  label: string;
};

/** Probed from the diagnostics route handler (no cookies; 401/405 still mean the route exists). */
export const SERVER_DIAGNOSTICS_PROBE_ROUTES: readonly ServerDiagnosticsProbeRoute[] = [
  { path: "/robots.txt", method: "GET", label: "Robots.txt" },
  { path: "/", method: "HEAD", label: "Home" },
  { path: "/about", method: "HEAD", label: "About" },
  { path: "/favorites", method: "HEAD", label: "Favorites" },
  { path: "/newsletter", method: "HEAD", label: "Newsletter page" },
  { path: "/api/newsletter", method: "GET", label: "Newsletter subscribe API" },
  { path: "/api/newsletter/confirm", method: "GET", label: "Newsletter confirm API" },
  { path: "/api/newsletter/unsubscribe", method: "GET", label: "Newsletter unsubscribe API" },
  { path: "/api/admin/control-room/summary", method: "GET", label: "Control room summary (no session)" },
] as const;

/** @deprecated Use BROWSER_PROBE_ROUTES */
export const ADMIN_GET_PROBE_ROUTES = BROWSER_PROBE_ROUTES;

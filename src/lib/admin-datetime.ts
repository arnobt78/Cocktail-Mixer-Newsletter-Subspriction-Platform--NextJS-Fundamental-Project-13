/**
 * Display for ISO timestamps in admin UI (SSR + client must match to avoid hydration errors).
 * Uses fixed locale + UTC because `toLocaleString(undefined, …)` differs between Node (Vercel)
 * and the browser (user locale / time zone).
 */
export function formatAdminDateTime(iso: string | undefined): string {
  if (!iso?.trim()) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(d);
  return `${formatted} UTC`;
}

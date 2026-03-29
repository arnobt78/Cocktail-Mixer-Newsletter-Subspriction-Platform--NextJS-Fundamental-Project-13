/** Locale-aware display for ISO timestamps in admin tables. */
export function formatAdminDateTime(iso: string | undefined): string {
  if (!iso?.trim()) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

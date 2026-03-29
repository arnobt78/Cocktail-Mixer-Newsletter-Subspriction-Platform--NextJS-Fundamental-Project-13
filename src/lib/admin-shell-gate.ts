import { cache } from "react";
import { cookies } from "next/headers";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";

export type AdminShellGate =
  | { state: "missing-env" }
  | { state: "unauthenticated" }
  | { state: "authenticated" };

/**
 * Fast gate for admin layout: env + session cookie only (no Redis / summary).
 * Use this so sidebar + top bar render without waiting on control-room data.
 * React cache() dedupes repeated calls in the same RSC request (layout + page segments).
 */
export const getAdminShellGate = cache(async function getAdminShellGate(): Promise<AdminShellGate> {
  if (!process.env.ADMIN_DASHBOARD_KEY) {
    return { state: "missing-env" };
  }
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!verifyAdminSessionValue(sessionValue)) {
    return { state: "unauthenticated" };
  }
  return { state: "authenticated" };
});

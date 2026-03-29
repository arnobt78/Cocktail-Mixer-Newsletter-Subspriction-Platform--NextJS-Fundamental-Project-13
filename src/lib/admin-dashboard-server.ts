/**
 * Heavier admin gate: session + Redis-backed control-room summary (counts, readiness flags).
 * Cached per RSC request like getAdminShellGate.
 */
import { cache } from "react";
import { cookies } from "next/headers";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";
import { getControlRoomSummary } from "@/lib/newsletter/control-room";

export type AdminDashboardGate =
  | { state: "missing-env" }
  | { state: "unauthenticated" }
  | {
      state: "ready";
      summary: Awaited<ReturnType<typeof getControlRoomSummary>>;
      fromEmail: string;
      replyToEmail: string;
    };

export const getAdminDashboardGate = cache(async function getAdminDashboardGate(): Promise<AdminDashboardGate> {
  if (!process.env.ADMIN_DASHBOARD_KEY) {
    return { state: "missing-env" };
  }
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!verifyAdminSessionValue(sessionValue)) {
    return { state: "unauthenticated" };
  }
  const summary = await getControlRoomSummary();
  return {
    state: "ready",
    summary,
    fromEmail: process.env.RESEND_FROM_EMAIL ?? "Not configured",
    replyToEmail: process.env.RESEND_REPLY_TO_EMAIL ?? "Not configured",
  };
});

/**
 * Route-handler guard: reads the admin session cookie and verifies HMAC. Use at the top of admin API routes.
 */
import { cookies } from "next/headers";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";

export async function assertAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  return verifyAdminSessionValue(sessionValue);
}

/**
 * Admin session cookie: HMAC-signed payload so the client cannot forge a session without ADMIN_SESSION_SECRET (or passkey fallback).
 * verifyAdminPasskey compares raw input to ADMIN_DASHBOARD_KEY (your “door code”).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "mixmaster_admin_session";

function getPasskey(): string {
  const passkey = process.env.ADMIN_DASHBOARD_KEY;
  if (!passkey) {
    throw new Error("ADMIN_DASHBOARD_KEY is not configured");
  }
  return passkey;
}

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? getPasskey();
}

function signValue(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function getAdminSessionCookieName(): string {
  return COOKIE_NAME;
}

export function createAdminSessionValue(): string {
  const payload = "admin:authorized";
  const sig = signValue(payload);
  return `${payload}.${sig}`;
}

export function verifyAdminSessionValue(raw: string | undefined): boolean {
  if (!raw) {
    return false;
  }

  const [payload, sig] = raw.split(".");
  if (!payload || !sig) {
    return false;
  }

  const expected = signValue(payload);
  if (sig.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function verifyAdminPasskey(value: string): boolean {
  const passkey = getPasskey();
  return value.trim() === passkey;
}

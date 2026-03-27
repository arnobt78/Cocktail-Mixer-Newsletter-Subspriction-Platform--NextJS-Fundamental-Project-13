import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret(): string {
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("NEWSLETTER_UNSUBSCRIBE_SECRET is not configured");
  }
  return secret;
}

function getConfirmSecret(): string {
  return process.env.NEWSLETTER_CONFIRM_SECRET ?? getSecret();
}

export function createUnsubscribeToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const secret = getSecret();
  return createHmac("sha256", secret).update(normalizedEmail).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = createUnsubscribeToken(email);
  const given = token.trim();
  if (expected.length !== given.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

export function createConfirmToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const secret = getConfirmSecret();
  return createHmac("sha256", secret).update(normalizedEmail).digest("hex");
}

export function verifyConfirmToken(email: string, token: string): boolean {
  const expected = createConfirmToken(email);
  const given = token.trim();
  if (expected.length !== given.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

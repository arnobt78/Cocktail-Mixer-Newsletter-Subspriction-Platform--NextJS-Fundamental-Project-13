/**
 * Newsletter domain logic: validation, subscribe → pending + confirmation link, confirm → active + welcome,
 * unsubscribe with signed tokens. Repository + mailer abstract Redis/Resend.
 */
import {
  deletePendingSubscriber,
  getPendingSubscriberByEmail,
  getSubscriberByEmail,
  isSubscriberExists,
  markSubscriberUnsubscribed,
  savePendingSubscriber,
  saveSubscriber,
} from "@/lib/newsletter/repository";
import {
  sendConfirmationEmail,
  sendWelcomeEmail,
} from "@/lib/newsletter/mailer";
import {
  createConfirmToken,
  createUnsubscribeToken,
  verifyConfirmToken,
  verifyUnsubscribeToken,
} from "@/lib/newsletter/security";
import type {
  NewsletterSubscribeRequest,
  NewsletterSubscriber,
  UnsubscribeReason,
} from "@/types/newsletter";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateNewsletterPayload(
  payload: NewsletterSubscribeRequest,
): string | null {
  if (
    !payload.firstName.trim() ||
    !payload.lastName.trim() ||
    !payload.email.trim()
  ) {
    return "Please fill in all fields.";
  }

  if (!EMAIL_REGEX.test(payload.email.trim().toLowerCase())) {
    return "Please provide a valid email address.";
  }

  return null;
}

export async function subscribeToNewsletter(
  payload: NewsletterSubscribeRequest,
): Promise<{ ok: boolean; message: string }> {
  const email = payload.email.trim().toLowerCase();
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  const exists = await isSubscriberExists(email);
  if (exists) {
    return {
      ok: true,
      message: "You are already subscribed. Thanks for staying with us.",
    };
  }

  const existingPending = await getPendingSubscriberByEmail(email);
  const pendingSubscriber: NewsletterSubscriber = {
    email,
    firstName,
    lastName,
    fullName,
    createdAt: existingPending?.createdAt ?? new Date().toISOString(),
  };

  await savePendingSubscriber(pendingSubscriber);
  const token = createConfirmToken(email);
  const confirmUrl = `${appUrl.replace(/\/$/, "")}/newsletter/confirm?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  await sendConfirmationEmail({ toEmail: email, fullName, confirmUrl });

  return {
    ok: true,
    message: "Please confirm your email from the link we just sent.",
  };
}

export async function confirmNewsletterSubscription(input: {
  email: string;
  token: string;
}): Promise<{ ok: boolean; message: string }> {
  const email = input.email.trim().toLowerCase();
  const token = input.token.trim();

  if (!email || !token) {
    return { ok: false, message: "Invalid confirmation request." };
  }

  if (!verifyConfirmToken(email, token)) {
    return { ok: false, message: "Invalid or expired confirmation link." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  const activeSubscriber = await getSubscriberByEmail(email);
  if (activeSubscriber && !activeSubscriber.unsubscribedAt) {
    return { ok: true, message: "Your subscription is already confirmed." };
  }

  const pending = await getPendingSubscriberByEmail(email);
  if (!pending) {
    return { ok: false, message: "Confirmation session expired. Please subscribe again." };
  }

  const confirmedSubscriber: NewsletterSubscriber = {
    ...pending,
    confirmedAt: new Date().toISOString(),
    unsubscribedAt: undefined,
    unsubscribeReason: undefined,
    unsubscribeFeedback: undefined,
  };

  await saveSubscriber(confirmedSubscriber);
  await deletePendingSubscriber(email);

  const unsubscribeToken = createUnsubscribeToken(email);
  const unsubscribeUrl = `${appUrl.replace(/\/$/, "")}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(unsubscribeToken)}`;

  await sendWelcomeEmail({
    toEmail: email,
    fullName: confirmedSubscriber.fullName,
    unsubscribeUrl,
  });

  return { ok: true, message: "Email confirmed. Welcome to MixMaster newsletter." };
}

export async function unsubscribeFromNewsletter(input: {
  email: string;
  token: string;
  reason?: UnsubscribeReason;
  feedback?: string;
}): Promise<{ ok: boolean; message: string }> {
  const email = input.email.trim().toLowerCase();
  const token = input.token.trim();

  if (!email || !token) {
    return { ok: false, message: "Invalid unsubscribe request." };
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return { ok: false, message: "Invalid or expired unsubscribe link." };
  }

  const subscriber = await getSubscriberByEmail(email);
  if (!subscriber) {
    return { ok: true, message: "You are already unsubscribed." };
  }

  if (subscriber.unsubscribedAt) {
    return { ok: true, message: "You are already unsubscribed." };
  }

  await markSubscriberUnsubscribedWithReason(email, input.reason, input.feedback);
  return { ok: true, message: "You have been unsubscribed successfully." };
}

async function markSubscriberUnsubscribedWithReason(
  email: string,
  reason?: UnsubscribeReason,
  feedback?: string,
): Promise<void> {
  const subscriber = await getSubscriberByEmail(email);
  if (!subscriber) {
    return;
  }

  await markSubscriberUnsubscribed(email);
  const updatedSubscriber = await getSubscriberByEmail(email);
  if (!updatedSubscriber) {
    return;
  }

  await saveSubscriber({
    ...updatedSubscriber,
    unsubscribeReason: reason,
    unsubscribeFeedback: feedback?.trim() || undefined,
  }, false);
}

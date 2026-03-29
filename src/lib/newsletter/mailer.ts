/** Resend wrapper: confirmation, welcome, broadcast HTML from templates; dead-letter on failure. */
import { Resend } from "resend";
import { randomInt } from "node:crypto";
import {
  getBroadcastEmailTemplate,
  getConfirmEmailTemplate,
  getDigestEmailTemplate,
  getWelcomeEmailTemplate,
} from "@/lib/newsletter/template";
import { saveDeadLetter } from "@/lib/newsletter/repository";

function getResendClient(): { resend: Resend; fromEmail: string; replyTo?: string } {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error("Resend is not configured");
  }

  return {
    resend: new Resend(apiKey),
    fromEmail,
    replyTo,
  };
}

function buildTokenizedSubject(baseSubject: string): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const stamp = `${y}${m}${d}-${hh}${mm}Z`;
  const nonce = String(randomInt(1000, 9999));

  return `${baseSubject} | Ref ${stamp}-${nonce}`;
}

export async function sendWelcomeEmail(input: {
  toEmail: string;
  fullName: string;
  unsubscribeUrl: string;
}): Promise<void> {
  const { resend, fromEmail, replyTo } = getResendClient();
  const template = getWelcomeEmailTemplate({
    fullName: input.fullName,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  await sendWithRetry({
    resend,
    fromEmail,
    toEmail: input.toEmail,
    subject: buildTokenizedSubject(template.subject),
    html: template.html,
    text: template.text,
    kind: "welcome",
    replyTo,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}

export async function sendConfirmationEmail(input: {
  toEmail: string;
  fullName: string;
  confirmUrl: string;
}): Promise<void> {
  const { resend, fromEmail, replyTo } = getResendClient();
  const template = getConfirmEmailTemplate({
    fullName: input.fullName,
    confirmUrl: input.confirmUrl,
  });

  await sendWithRetry({
    resend,
    fromEmail,
    toEmail: input.toEmail,
    subject: buildTokenizedSubject(template.subject),
    html: template.html,
    text: template.text,
    kind: "confirmation",
    replyTo,
  });
}

export async function sendDigestEmail(input: {
  toEmail: string;
  fullName: string;
  weekLabel: string;
  unsubscribeUrl: string;
}): Promise<void> {
  const { resend, fromEmail, replyTo } = getResendClient();
  const template = getDigestEmailTemplate({
    fullName: input.fullName,
    unsubscribeUrl: input.unsubscribeUrl,
    weekLabel: input.weekLabel,
  });

  await sendWithRetry({
    resend,
    fromEmail,
    toEmail: input.toEmail,
    subject: buildTokenizedSubject(template.subject),
    html: template.html,
    text: template.text,
    kind: "digest",
    replyTo,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}

export async function sendBroadcastEmail(input: {
  toEmail: string;
  fullName: string;
  subject: string;
  preheader: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
}): Promise<void> {
  const { resend, fromEmail, replyTo } = getResendClient();
  const template = getBroadcastEmailTemplate({
    fullName: input.fullName,
    subject: input.subject,
    preheader: input.preheader,
    body: input.body,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  await sendWithRetry({
    resend,
    fromEmail,
    toEmail: input.toEmail,
    subject: buildTokenizedSubject(template.subject),
    html: template.html,
    text: template.text,
    kind: "broadcast",
    replyTo,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}

async function sendWithRetry(input: {
  resend: Resend;
  fromEmail: string;
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  kind: string;
  replyTo?: string;
  unsubscribeUrl?: string;
}): Promise<void> {
  let lastErrorMessage = "Unknown mail error";
  const normalizedHtml = normalizeHtml(input.html);
  const normalizedText = normalizeText(input.text);
  const headers = input.unsubscribeUrl
    ? {
        "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      }
    : undefined;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { error } = await input.resend.emails.send({
      from: input.fromEmail,
      to: input.toEmail,
      subject: input.subject,
      html: normalizedHtml,
      text: normalizedText,
      replyTo: input.replyTo,
      headers,
    });

    if (!error) {
      return;
    }

    lastErrorMessage = error.message;
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 350));
    }
  }

  await saveDeadLetter({
    kind: input.kind,
    toEmail: input.toEmail,
    subject: input.subject,
    error: lastErrorMessage,
    payload: {
      subject: input.subject,
      textPreview: normalizedText.slice(0, 200),
    },
  });

  throw new Error(lastErrorMessage);
}

function normalizeHtml(html: string): string {
  return html.replace(/\n\s+\n/g, "\n").trim();
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

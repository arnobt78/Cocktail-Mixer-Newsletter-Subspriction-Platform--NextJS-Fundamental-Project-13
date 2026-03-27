interface WelcomeEmailTemplateInput {
  fullName: string;
  unsubscribeUrl: string;
}

interface ConfirmEmailTemplateInput {
  fullName: string;
  confirmUrl: string;
}
interface DigestEmailTemplateInput {
  fullName: string;
  unsubscribeUrl: string;
  weekLabel: string;
}
interface BroadcastEmailTemplateInput {
  fullName: string;
  subject: string;
  preheader: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
}

export function getConfirmEmailTemplate({
  fullName,
  confirmUrl,
}: ConfirmEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Confirm your MixMaster newsletter subscription";
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
    <div style="padding: 22px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
      <h1 style="margin: 0; font-size: 24px; color: #0f172a;">Confirm your subscription</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #475569;">One quick step to complete your newsletter signup.</p>
    </div>
    <div style="padding: 22px;">
      <p style="margin: 0 0 12px; font-size: 16px; color: #0f172a;">Hi ${fullName},</p>
      <p style="margin: 0 0 20px; line-height: 1.6; color: #1e293b;">Please confirm your email address to start receiving MixMaster updates.</p>
      <a href="${confirmUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 8px; background: #0ea5e9; color: #ffffff; text-decoration: none; font-weight: 700;">
        Confirm subscription
      </a>
      <p style="margin: 16px 0 0; font-size: 12px; color: #64748b;">If the button does not work, copy and paste this URL into your browser: ${confirmUrl}</p>
    </div>
    ${getComplianceFooterHtml()}
  </div>`;
  const text = `Hi ${fullName}, please confirm your MixMaster subscription: ${confirmUrl}`;
  return { subject, html, text };
}

export function getWelcomeEmailTemplate({
  fullName,
  unsubscribeUrl,
}: WelcomeEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Welcome to MixMaster, ${fullName}!`;
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b1220; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
    <div style="padding: 24px; background: linear-gradient(90deg, rgba(16,185,129,0.35), rgba(6,182,212,0.25)); border-bottom: 1px solid #1e293b;">
      <h1 style="margin: 0; font-size: 24px; color: #f8fafc;">MixMaster Newsletter</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #cbd5e1;">Cocktail ideas, product updates, and frontend learning tips.</p>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 12px; font-size: 16px;">Hi ${fullName},</p>
      <p style="margin: 0 0 12px; line-height: 1.6;">Thanks for subscribing to MixMaster. You are now on the list for updates and practical tutorials.</p>
      <p style="margin: 0 0 20px; line-height: 1.6;">We send concise, useful content only.</p>
      <a href="https://arnobmahmud.com" style="display: inline-block; padding: 10px 16px; border-radius: 8px; background: #10b981; color: #ffffff; text-decoration: none; font-weight: 700;">
        Visit MixMaster
      </a>
    </div>
    ${getComplianceFooterHtml(unsubscribeUrl)}
  </div>`;
  const text = `Hi ${fullName}, thanks for subscribing to MixMaster. You are now on our newsletter list.\n\nUnsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text };
}

export function getDigestEmailTemplate({
  fullName,
  unsubscribeUrl,
  weekLabel,
}: DigestEmailTemplateInput): { subject: string; html: string; text: string } {
  const subject = `MixMaster Weekly Brief - ${weekLabel}`;
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b1220; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
    <div style="padding: 24px; border-bottom: 1px solid #1e293b;">
      <h1 style="margin: 0; font-size: 22px; color: #f8fafc;">MixMaster Weekly Brief</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #cbd5e1;">Short updates for your cocktail and frontend learning journey.</p>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 12px;">Hi ${fullName},</p>
      <p style="margin: 0 0 12px; line-height: 1.6;">Here is your weekly digest:</p>
      <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.7;">
        <li>New UI improvements and layout refinements</li>
        <li>Better favorites and search experience</li>
        <li>Newsletter pipeline with secure confirmation flow</li>
      </ul>
      <p style="margin: 0;">Visit MixMaster anytime for fresh updates.</p>
    </div>
    ${getComplianceFooterHtml(unsubscribeUrl)}
  </div>`;
  const text = `Hi ${fullName}, here is your MixMaster weekly brief for ${weekLabel}. Unsubscribe: ${unsubscribeUrl}`;
  return { subject, html, text };
}

export function getBroadcastEmailTemplate({
  fullName,
  subject,
  preheader,
  body,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
}: BroadcastEmailTemplateInput): { subject: string; html: string; text: string } {
  const paragraphs = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin: 0 0 12px; line-height: 1.7; color: #e2e8f0;">${escapeHtml(line)}</p>`,
    )
    .join("");

  const ctaHtml =
    ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" style="display: inline-block; margin-top: 8px; padding: 10px 16px; border-radius: 8px; background: #10b981; color: #ffffff; text-decoration: none; font-weight: 700;">
          ${escapeHtml(ctaLabel)}
        </a>`
      : "";

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b1220; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
    <div style="padding: 24px; border-bottom: 1px solid #1e293b;">
      <h1 style="margin: 0; font-size: 22px; color: #f8fafc;">${escapeHtml(subject)}</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #cbd5e1;">${escapeHtml(preheader)}</p>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 12px; color: #e2e8f0;">Hi ${escapeHtml(fullName)},</p>
      ${paragraphs}
      ${ctaHtml}
    </div>
    ${getComplianceFooterHtml(unsubscribeUrl)}
  </div>`;

  const text = `Hi ${fullName}\n\n${body}\n\n${ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}\n\n` : ""}Unsubscribe: ${unsubscribeUrl}`;
  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getComplianceFooterHtml(unsubscribeUrl?: string): string {
  const unsubscribeHtml = unsubscribeUrl
    ? `<p style="margin: 0;">If you no longer want these emails, you can
        <a href="${unsubscribeUrl}" style="color: #0ea5e9; text-decoration: underline; margin-left: 4px;">unsubscribe instantly</a>.
      </p>`
    : `<p style="margin: 0;">If this wasn't you, you can ignore this email and no subscription will be activated.</p>`;

  return `<div style="padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
      <p style="margin: 0 0 8px;">You are receiving this email because you opted in on MixMaster.</p>
      <p style="margin: 0 0 8px;">MixMaster, Learning Project Newsletter</p>
      ${unsubscribeHtml}
    </div>`;
}

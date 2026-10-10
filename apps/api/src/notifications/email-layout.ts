import type { PlatformBranding } from '@prisma/client';

export const DEFAULT_EMAIL_LOGO_PATH = '/brand/lugemi-email-logo.png';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteUrl(pathOrUrl: string, publicBase: string): string {
  const raw = pathOrUrl.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  const base = publicBase.replace(/\/$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}

function formatAddress(branding: PlatformBranding): string {
  const lines = [
    branding.addressLine1,
    branding.addressLine2,
    [branding.city, branding.region, branding.postalCode].filter(Boolean).join(', '),
    branding.country,
  ]
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.join('<br />');
}

type SocialLink = { label: string; href: string; mark: string };

function socialLinks(branding: PlatformBranding): SocialLink[] {
  return [
    { label: 'Website', href: branding.socialWebsite, mark: 'W' },
    { label: 'X', href: branding.socialX, mark: 'X' },
    { label: 'LinkedIn', href: branding.socialLinkedIn, mark: 'in' },
    { label: 'GitHub', href: branding.socialGitHub, mark: 'GH' },
  ].filter((l) => Boolean(l.href.trim()));
}

/** Shared HTML wrapper for all Lugemi system emails (logo header + address/social footer). */
export function renderSystemEmailHtml(input: {
  branding: PlatformBranding;
  title: string;
  bodyHtml: string;
  publicBaseUrl?: string;
}): string {
  const publicBase =
    input.publicBaseUrl?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.APP_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://127.0.0.1:43123';
  const company = escapeHtml(input.branding.companyName || 'Lugemi');
  const logo = absoluteUrl(input.branding.logoUrl || DEFAULT_EMAIL_LOGO_PATH, publicBase);
  const address = formatAddress(input.branding);
  const socials = socialLinks(input.branding);
  const socialHtml = socials.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px 0 0;border-collapse:collapse;"><tr>${socials
        .map(
          (s) =>
            `<td style="padding:0 8px 0 0;"><a href="${escapeHtml(s.href)}" title="${escapeHtml(s.label)}" aria-label="${escapeHtml(s.label)}" style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:14px;background:#007c78;color:#ffffff;text-decoration:none;font-size:11px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(s.mark)}</a></td>`,
        )
        .join('')}</tr></table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(input.title)}</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Georgia,'Times New Roman',serif;color:#10264d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #d9e2ef;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:22px 28px;border-bottom:1px solid #e8eef6;background:#0a1931;">
          ${
            logo
              ? `<img src="${escapeHtml(logo)}" alt="${company}" width="200" style="display:block;border:0;width:200px;max-width:70%;height:auto;" />`
              : `<div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">${company}</div>`
          }
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;letter-spacing:-0.02em;">${escapeHtml(input.title)}</h1>
          <div style="font-size:15px;line-height:1.55;color:#243552;">${input.bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:18px 28px 24px;border-top:1px solid #e8eef6;background:#fafbfd;color:#5b6b82;font-size:12px;line-height:1.5;">
          ${address ? `<p style="margin:0;">${address}</p>` : `<p style="margin:0;">${company}</p>`}
          ${socialHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 12px;">${escapeHtml(text)}</p>`;
}

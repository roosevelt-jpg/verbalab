import type { PlatformBranding } from '@prisma/client';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteUrl(pathOrUrl: string, publicBase: string): string {
  const raw = pathOrUrl.trim;
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
    .map((l) => l.trim)
    .filter(Boolean);
  return lines.join('<br />');
}

function socialLinks(branding: PlatformBranding): Array<{ label: string; href: string }> {
  return [
    { label: 'Website', href: branding.socialWebsite },
    { label: 'X', href: branding.socialX },
    { label: 'LinkedIn', href: branding.socialLinkedIn },
    { label: 'GitHub', href: branding.socialGitHub },
  ].filter((l) => Boolean(l.href.trim));
}

/** Shared HTML wrapper for all Lugemi system emails (logo header + address/social footer). */
export function renderSystemEmailHtml(input: {
  branding: PlatformBranding;
  title: string;
  bodyHtml: string;
  publicBaseUrl?: string;
}): string {
  const publicBase =
    input.publicBaseUrl?.trim ||
    process.env.APP_PUBLIC_URL?.trim ||
    process.env.NEXT_PUBLIC_APP_URL?.trim ||
    'http://127.0.0.1:43123';
  const company = escapeHtml(input.branding.companyName || 'Lugemi');
  const logo = absoluteUrl(input.branding.logoUrl || '/brand/lugemi-symbol-teal.svg', publicBase);
  const address = formatAddress(input.branding);
  const socials = socialLinks(input.branding);
  const socialHtml = socials.length
    ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;">${socials
        .map(
          (s) =>
            `<a href="${escapeHtml(s.href)}" style="color:#007c78;text-decoration:none;margin-right:12px;">${escapeHtml(s.label)}</a>`,
        )
        .join('')}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(input.title)}</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Georgia,'Times New Roman',serif;color:#10264d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #d9e2ef;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:20px 28px;border-bottom:1px solid #e8eef6;background:linear-gradient(135deg,#f7fffe,#f4f7fb);">
          ${
            logo
              ? `<img src="${escapeHtml(logo)}" alt="${company}" width="48" height="54" style="display:block;border:0;" />`
              : ''
          }
          <div style="margin-top:10px;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#10264d;">${company}</div>
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

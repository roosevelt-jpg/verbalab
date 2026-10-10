import { describe, expect, it } from 'vitest';
import { PlatformBranding } from '@prisma/client';
import { DEFAULT_EMAIL_LOGO_PATH, paragraph, renderSystemEmailHtml } from '../src/notifications/email-layout';

function branding(partial: Partial<PlatformBranding> = {}): PlatformBranding {
  return {
    id: 'default',
    companyName: 'Lugemi',
    logoUrl: DEFAULT_EMAIL_LOGO_PATH,
    addressLine1: '100 Market Street',
    addressLine2: 'Suite 4',
    city: 'San Francisco',
    region: 'CA',
    postalCode: '94105',
    country: 'USA',
    socialX: 'https://x.com/lugemi',
    socialLinkedIn: 'https://linkedin.com/company/lugemi',
    socialGitHub: 'https://github.com/lugemi',
    socialWebsite: 'https://lugemi.com',
    updatedAt: new Date(),
    ...partial,
  };
}

describe('email-layout', () => {
  it('renders Lugemi logo header and address/social footer with absolute logo URL', () => {
    const html = renderSystemEmailHtml({
      branding: branding(),
      title: 'Job succeeded',
      bodyHtml: paragraph('Your batch finished.'),
      publicBaseUrl: 'https://app.lugemi.example',
    });

    expect(html).toContain('https://app.lugemi.example/brand/lugemi-email-logo.png');
    expect(html).toContain('alt="Lugemi"');
    expect(html).toContain('100 Market Street');
    expect(html).toContain('San Francisco, CA, 94105');
    expect(html).toContain('https://x.com/lugemi');
    expect(html).toContain('aria-label="LinkedIn"');
    expect(html).toContain('Your batch finished.');
    expect(html).not.toMatch(/elevenlabs|verbalab/i);
  });

  it('falls back to APP_PUBLIC_URL when publicBaseUrl omitted', () => {
    const prev = process.env.APP_PUBLIC_URL;
    process.env.APP_PUBLIC_URL = 'https://from-env.example';
    try {
      const html = renderSystemEmailHtml({
        branding: branding({ logoUrl: '' }),
        title: 'Hello',
        bodyHtml: paragraph('Body'),
      });
      expect(html).toContain(`https://from-env.example${DEFAULT_EMAIL_LOGO_PATH}`);
    } finally {
      if (prev === undefined) delete process.env.APP_PUBLIC_URL;
      else process.env.APP_PUBLIC_URL = prev;
    }
  });
});

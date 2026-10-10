import { describe, expect, it } from 'vitest';
import type { CmsDocument } from '@/data/cms-types';
import { absolutize, buildMetadataFromSeo, resolveCmsSeo } from './cms-seo';

const DOC = {
  version: 2,
  updatedAt: '2026-01-01T00:00:00.000Z',
  brand: {
    name: 'Lugemi',
    domain: 'lugemi.com',
    tagline: 'Tagline',
    positioning: 'Positioning fallback description for SEO.',
  },
  seo: {
    title: 'Lugemi site title',
    description: 'Site-wide description',
    ogImageUrl: '/brand/lugemi-email-logo.png',
    ogImageAlt: 'Lugemi',
  },
  routeSeo: {
    '/': {
      title: 'Lugemi home',
      description: 'Home description',
    },
    '/pricing': {
      title: 'Pricing',
      description: 'Pricing description',
    },
    '/onboarding': {
      title: 'Welcome',
      description: 'Onboarding',
      noIndex: true,
    },
  },
  hero: {
    eyebrow: '',
    brand: 'Lugemi',
    headline: 'Headline',
    lead: 'Lead',
    primaryCta: { label: 'Go', href: '/' },
    secondaryCta: { label: 'More', href: '/' },
    demo: {
      title: 'Demo',
      badge: '',
      defaultText: '',
      playHint: '',
      voices: [],
    },
  },
} as unknown as CmsDocument;

describe('cms-seo', () => {
  it('resolves site defaults for home', () => {
    const seo = resolveCmsSeo(DOC, '/');
    expect(seo.title).toBe('Lugemi home');
    expect(seo.description).toBe('Home description');
    expect(seo.ogImageUrl).toContain('lugemi');
  });

  it('prefers page seo over route and site', () => {
    const seo = resolveCmsSeo(DOC, '/p/trade', {
      slug: 'trade',
      title: 'Trade page',
      lead: 'Trade lead',
      body: 'Body',
      seo: {
        title: 'Trade SEO',
        description: 'Trade meta description',
        ogImageUrl: '/cms-media/trade.png',
      },
    });
    expect(seo.title).toBe('Trade SEO');
    expect(seo.description).toBe('Trade meta description');
    expect(seo.ogImageUrl).toBe('/cms-media/trade.png');
  });

  it('builds openGraph and twitter cards', () => {
    const seo = resolveCmsSeo(DOC, '/pricing');
    const meta = buildMetadataFromSeo({ path: '/pricing', seo, siteName: 'Lugemi' });
    expect(meta.openGraph?.title).toBe(seo.title);
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(absolutize('/brand/x.png')).toBe('https://lugemi.com/brand/x.png');
  });

  it('honours noIndex on onboarding route', () => {
    const seo = resolveCmsSeo(DOC, '/onboarding');
    expect(seo.noIndex).toBe(true);
    const meta = buildMetadataFromSeo({ path: '/onboarding', seo });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});

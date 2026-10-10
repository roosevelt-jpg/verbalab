import type { Metadata } from 'next';
import type { CmsDocument, CmsPage, CmsSeo } from '@/data/cms-types';

export const DEFAULT_OG_IMAGE = '/brand/lugemi-email-logo.png';
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://lugemi.com';

function pick(...values: Array<string | undefined | null>): string | undefined {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

export function absolutize(url: string | undefined, origin = SITE_ORIGIN): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${path}`;
}

/** Merge page → route → site SEO with content fallbacks. */
export function resolveCmsSeo(
  doc: CmsDocument,
  path: string,
  page?: CmsPage | null,
  fallbacks?: { title?: string; description?: string; ogImageUrl?: string },
): Required<Pick<CmsSeo, 'title' | 'description' | 'ogImageUrl' | 'ogImageAlt'>> & {
  noIndex: boolean;
} {
  const route = doc.routeSeo?.[path] ?? {};
  const site = doc.seo ?? {};
  const pageSeo = page?.seo ?? {};

  const title =
    pick(
      pageSeo.title,
      route.title,
      page?.title,
      fallbacks?.title,
      site.title,
      doc.brand?.name,
    ) ?? 'Lugemi';
  const description =
    pick(
      pageSeo.description,
      route.description,
      page?.lead,
      fallbacks?.description,
      site.description,
      doc.brand?.positioning,
      doc.brand?.tagline,
    ) ?? 'Lugemi — Africa-first language intelligence.';
  const ogImageUrl =
    pick(
      pageSeo.ogImageUrl,
      route.ogImageUrl,
      page?.media?.imageUrl,
      fallbacks?.ogImageUrl,
      doc.hero?.media?.imageUrl,
      site.ogImageUrl,
      DEFAULT_OG_IMAGE,
    ) ?? DEFAULT_OG_IMAGE;
  const ogImageAlt =
    pick(pageSeo.ogImageAlt, route.ogImageAlt, site.ogImageAlt, page?.media?.alt, doc.brand?.name) ??
    'Lugemi';
  const noIndex = Boolean(pageSeo.noIndex ?? route.noIndex ?? site.noIndex);

  return { title, description, ogImageUrl, ogImageAlt, noIndex };
}

export function buildMetadataFromSeo(input: {
  path: string;
  seo: ReturnType<typeof resolveCmsSeo>;
  siteName?: string;
  /** Home uses an absolute title so the layout template does not double the brand. */
  absoluteTitle?: boolean;
}): Metadata {
  const { path, seo, siteName = 'Lugemi', absoluteTitle } = input;
  const url = absolutize(path) ?? SITE_ORIGIN;
  const image = absolutize(seo.ogImageUrl) ?? absolutize(DEFAULT_OG_IMAGE)!;

  return {
    title: absoluteTitle ? { absolute: seo.title } : seo.title,
    description: seo.description,
    robots: seo.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName,
      title: seo.title,
      description: seo.description,
      images: [{ url: image, alt: seo.ogImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

/** Load CMS and build Next.js Metadata for a public path (optional /p page). */
export async function buildCmsMetadata(
  path: string,
  opts?: {
    page?: CmsPage | null;
    fallbackTitle?: string;
    fallbackDescription?: string;
    absoluteTitle?: boolean;
  },
): Promise<Metadata> {
  const { getCmsDocument } = await import('@/lib/cms');
  const doc = await getCmsDocument();
  const seo = resolveCmsSeo(doc, path, opts?.page, {
    title: opts?.fallbackTitle,
    description: opts?.fallbackDescription,
  });
  return buildMetadataFromSeo({
    path,
    seo,
    siteName: doc.brand?.name ?? 'Lugemi',
    absoluteTitle: opts?.absoluteTitle ?? path === '/',
  });
}

import type { MetadataRoute } from 'next';
import { listCmsPageSlugs } from '@/lib/cms';
import { SITE_ORIGIN } from '@/lib/cms-seo';

const STATIC_ROUTES = [
  '/',
  '/pricing',
  '/coverage',
  '/baobab',
  '/enterprise',
  '/organizations',
  '/mcp',
  '/docs',
  '/docs/api',
  '/accent-identity',
  '/developers',
  '/sign-up',
  '/dealbridge',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listCmsPageSlugs();
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_ORIGIN}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));
  const pageEntries: MetadataRoute.Sitemap = slugs
    .filter((slug) => slug !== 'enterprise' && slug !== 'openapi-explorer')
    .map((slug) => ({
      url: `${SITE_ORIGIN}/p/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  return [...staticEntries, ...pageEntries];
}

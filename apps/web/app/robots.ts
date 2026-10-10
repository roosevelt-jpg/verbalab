import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/cms-seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/api/', '/onboarding', '/dev-login', '/setup'],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}

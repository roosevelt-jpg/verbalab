import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Noto_Sans, Noto_Sans_Mono } from 'next/font/google';
import './globals.css';
import '@/components/marketing/marketing.css';
import { lugemiClerkAppearance, lugemiClerkLocalization } from '@/lib/clerk-appearance';
import { isClerkConfigured } from '@/lib/clerk-config';
import { mustUseLiveClerkLocalOrigin } from '@/lib/live-clerk-local-origin';
import { LiveKeyOriginGate } from '@/components/live-key-origin-gate';
import { SentryInit } from '@/components/sentry-init';
import { SupportChatWidget } from '@/components/support/support-chat';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const noto = Noto_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto',
});

const notoMono = Noto_Sans_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-mono',
});

export async function generateMetadata(): Promise<Metadata> {
  const { getCmsDocument } = await import('@/lib/cms');
  const { absolutize, DEFAULT_OG_IMAGE, resolveCmsSeo, SITE_ORIGIN } = await import(
    '@/lib/cms-seo'
  );
  const doc = await getCmsDocument();
  const seo = resolveCmsSeo(doc, '/');
  const image = absolutize(seo.ogImageUrl) ?? absolutize(DEFAULT_OG_IMAGE)!;
  const brand = doc.brand?.name ?? 'Lugemi';

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: {
      default: seo.title,
      template: `%s · ${brand}`,
    },
    description: seo.description,
    applicationName: brand,
    icons: {
      icon: '/brand/lugemi-symbol-teal.svg',
      apple: '/brand/lugemi-symbol-teal.svg',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: brand,
      title: seo.title,
      description: seo.description,
      url: SITE_ORIGIN,
      images: [{ url: image, alt: seo.ogImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [image],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const hostHeader = headerStore.get('x-forwarded-host') || headerStore.get('host');
  const blockClerkOnBareLocal = mustUseLiveClerkLocalOrigin({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hostHeader,
  });

  return (
    <html lang="en" className={`${noto.variable} ${notoMono.variable}`}>
      <body className={noto.className}>
        <SentryInit />
        {isClerkConfigured() ? (
          <ClerkProvider
            appearance={lugemiClerkAppearance}
            localization={lugemiClerkLocalization}
            afterSignOutUrl="/"
          >
            {blockClerkOnBareLocal ? (
              <LiveKeyOriginGate blockClerk>{children}</LiveKeyOriginGate>
            ) : (
              children
            )}
          </ClerkProvider>
        ) : (
          children
        )}
        <SupportChatWidget />
      </body>
    </html>
  );
}

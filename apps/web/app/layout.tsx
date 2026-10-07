import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Noto_Sans, Noto_Sans_Mono } from 'next/font/google';
import './globals.css';
import '@/components/marketing/marketing.css';
import { isClerkConfigured } from '@/lib/clerk-config';
import { mustUseLiveClerkLocalOrigin } from '@/lib/live-clerk-local-origin';
import { LiveKeyOriginGate } from '@/components/live-key-origin-gate';
import { SentryInit } from '@/components/sentry-init';
import { SupportChatWidget } from '@/components/support/support-chat';

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

export const metadata: Metadata = {
  metadataBase: new URL('https://lugemi.com'),
  title: {
    default: 'Lugemi',
    template: '%s · Lugemi',
  },
  description:
    'Lugemi is Africa-first language intelligence infrastructure with a first-party API and first-party models for speech, text, and translation. Built for African languages, dialects, accents, and scripts; also supporting LATAM, Southeast Asia, the Middle East, and the EU.',
  applicationName: 'Lugemi',
  icons: {
    icon: '/brand/lugemi-symbol-teal.svg',
    apple: '/brand/lugemi-symbol-teal.svg',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const hostHeader = headerStore.get('x-forwarded-host') || headerStore.get('host');
  const blockClerkOnBareLocal = mustUseLiveClerkLocalOrigin({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hostHeader,
  });

  const clerkLocalization = {
    signIn: {
      start: {
        title: 'Sign in to Lugemi',
        subtitle: 'Welcome back — continue to your workspace',
      },
    },
    signUp: {
      start: {
        title: 'Create your Lugemi account',
        subtitle: 'Start building with Africa-first language intelligence',
      },
    },
  };

  return (
    <html lang="en" className={`${noto.variable} ${notoMono.variable}`}>
      <body>
        <SentryInit />
        {isClerkConfigured() ? (
          blockClerkOnBareLocal ? (
            // Live keys + bare loopback: skip ClerkProvider (FAPI origin_invalid) but still
            // serve marketing /health /dev-login instructions on http://127.0.0.1:43125.
            <LiveKeyOriginGate blockClerk>{children}</LiveKeyOriginGate>
          ) : (
            <ClerkProvider localization={clerkLocalization}>{children}</ClerkProvider>
          )
        ) : (
          children
        )}
        <SupportChatWidget />
      </body>
    </html>
  );
}

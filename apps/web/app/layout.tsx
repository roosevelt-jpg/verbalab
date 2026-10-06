import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Noto_Sans, Noto_Sans_Mono } from 'next/font/google';
import './globals.css';
import { isClerkConfigured } from '@/lib/clerk-config';
import { SentryInit } from '@/components/sentry-init';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${noto.variable} ${notoMono.variable}`}>
      <body>
        <SentryInit />
        {isClerkConfigured() ? <ClerkProvider>{children}</ClerkProvider> : children}
      </body>
    </html>
  );
}

import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { DM_Sans, Syne } from 'next/font/google';
import './globals.css';
import { isClerkConfigured } from '@/lib/clerk-config';
import { SentryInit } from '@/components/sentry-init';

const display = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
});

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'VerbaLab',
  description: 'Enterprise language intelligence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <SentryInit />
        {isClerkConfigured() ? <ClerkProvider>{children}</ClerkProvider> : children}
      </body>
    </html>
  );
}

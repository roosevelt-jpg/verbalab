import type { Metadata } from 'next';
import { Syne } from 'next/font/google';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingNav } from '@/components/marketing/nav';
import { getCmsDocument } from '@/lib/cms';
import { BaobabClient } from './baobab-client';
import '@/components/marketing/marketing.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-syne',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Baobab',
  description:
    'Lugemi Baobab — cinematic next-model canopy for Mix, Fidelity, Live, Edge, Grounded, Atlas, Baobab, and Echo. Africa-first language intelligence in navy and teal depth.',
};

export default async function BaobabPage() {
  const doc = await getCmsDocument();

  return (
    <div className={`mkt ${syne.variable}`}>
      <a className="mkt-skip" href="#main">
        Skip to content
      </a>
      <MarketingNav nav={doc.nav} />
      <main id="main">
        <BaobabClient brandName={doc.brand.name} />
      </main>
      <MarketingFooter footer={doc.footer} brand={doc.brand} />
    </div>
  );
}

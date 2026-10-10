import type { Metadata } from 'next';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingNav } from '@/components/marketing/nav';
import { getCmsDocument } from '@/lib/cms';
import { PricingClient } from './pricing-client';
import '@/components/marketing/marketing.css';
import '@/components/marketing/pricing.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Lugemi plans for speech, translate, and speaking agents — Free, Pro, Business, and Enterprise. Transparent character quotas and workspace limits.',
};

export default async function PricingPage() {
  const doc = await getCmsDocument();

  return (
    <div className="mkt">
      <a className="mkt-skip" href="#main">
        Skip to content
      </a>
      <MarketingNav nav={doc.nav} />
      <main id="main">
        <PricingClient brandName={doc.brand.name} />
      </main>
      <MarketingFooter footer={doc.footer} brand={doc.brand} />
    </div>
  );
}

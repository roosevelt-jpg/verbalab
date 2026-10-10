import type { Metadata } from 'next';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingNav } from '@/components/marketing/nav';
import { getCmsDocument } from '@/lib/cms';
import { CoverageClient } from './coverage-client';
import '@/components/marketing/marketing.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Language coverage',
  description:
    'Lugemi public language coverage matrix — Africa-first completeness across speech, translate, and speaking-agent corridors. Registry membership is not a live-quality certificate.',
};

export default async function CoveragePage() {
  const doc = await getCmsDocument();

  return (
    <div className="mkt">
      <a className="mkt-skip" href="#main">
        Skip to content
      </a>
      <MarketingNav nav={doc.nav} />
      <main id="main">
        <CoverageClient />
      </main>
      <MarketingFooter footer={doc.footer} brand={doc.brand} />
    </div>
  );
}

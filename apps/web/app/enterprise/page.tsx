import type { Metadata } from 'next';
import { EnterpriseMarketingPage } from '@/components/marketing/enterprise-page';
import { getCmsDocument } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enterprise',
  description:
    'Lugemi Enterprise — SSO, dedicated capacity, LugemiCreative and LugemiAgents, residency, and honest security controls for organizational language AI.',
};

export default async function EnterprisePage() {
  const content = await getCmsDocument();
  return <EnterpriseMarketingPage content={content} />;
}

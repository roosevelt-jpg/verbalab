import type { Metadata } from 'next';
import { OrganizationsMarketingPage } from '@/components/marketing/organizations-page';
import { getCmsDocument } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lugemi for organisations',
  description:
    'Lugemi helps UN agencies, NGOs, and governments reach communities in their own languages — live meetings, multilingual messages, and documents, spoken by native voices.',
};

export default async function OrganizationsPage() {
  const content = await getCmsDocument();
  return <OrganizationsMarketingPage content={content} />;
}

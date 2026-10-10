import type { Metadata } from 'next';
import { OrganizationsMarketingPage } from '@/components/marketing/organizations-page';
import { getCmsDocument } from '@/lib/cms';
import { buildCmsMetadata } from '@/lib/cms-seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/organizations', {
    fallbackTitle: 'Lugemi for organisations',
    fallbackDescription:
      'Lugemi helps UN agencies, NGOs, and governments reach communities in their own languages — live meetings, multilingual messages, and documents, spoken by native voices.',
  });
}

export default async function OrganizationsPage() {
  const content = await getCmsDocument();
  return <OrganizationsMarketingPage content={content} />;
}

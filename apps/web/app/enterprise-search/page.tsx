import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { EnterpriseSearchClient } from './enterprise-search-client';

export default function EnterpriseSearchPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <EnterpriseSearchClient />;
}

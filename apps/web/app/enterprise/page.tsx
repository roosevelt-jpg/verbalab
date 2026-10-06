import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { EnterpriseClient } from './enterprise-client';

export default function EnterprisePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <EnterpriseClient />;
}

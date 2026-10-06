import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { EnterpriseRagClient } from './enterprise-rag-client';

export default function EnterpriseRagPage {
  if (!isClerkConfigured) redirect('/setup');
  return <EnterpriseRagClient />;
}

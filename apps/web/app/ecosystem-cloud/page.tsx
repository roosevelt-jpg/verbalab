import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { EcosystemCloudClient } from './ecosystem-cloud-client';

export default function EcosystemCloudPage {
  if (!isClerkConfigured) redirect('/setup');
  return <EcosystemCloudClient />;
}

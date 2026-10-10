import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { IntelligenceCloudClient } from './intelligence-cloud-client';

export default function IntelligenceCloudPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <IntelligenceCloudClient />;
}

import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AfricanIntelligenceCloudClient } from './african-intelligence-cloud-client';

export default function AfricanIntelligenceCloudPage {
  if (!isClerkConfigured) redirect('/setup');
  return <AfricanIntelligenceCloudClient />;
}

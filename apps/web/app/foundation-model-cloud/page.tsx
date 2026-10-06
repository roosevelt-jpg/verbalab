import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { FoundationModelCloudClient } from './foundation-model-cloud-client';

export default function FoundationModelCloudPage {
  if (!isClerkConfigured) redirect('/setup');
  return <FoundationModelCloudClient />;
}

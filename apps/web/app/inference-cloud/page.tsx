import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { InferenceCloudClient } from './inference-cloud-client';

export default function InferenceCloudPage {
  if (!isClerkConfigured) redirect('/setup');
  return <InferenceCloudClient />;
}

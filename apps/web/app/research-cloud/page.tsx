import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ResearchCloudClient } from './research-cloud-client';

export default function ResearchCloudPage {
  if (!isClerkConfigured) redirect('/setup');
  return <ResearchCloudClient />;
}

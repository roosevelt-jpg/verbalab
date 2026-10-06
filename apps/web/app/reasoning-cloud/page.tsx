import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ReasoningCloudClient } from './reasoning-cloud-client';

export default function ReasoningCloudPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ReasoningCloudClient />;
}

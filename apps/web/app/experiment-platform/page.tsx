import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ExperimentPlatformClient } from './experiment-platform-client';

export default function ExperimentPlatformPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ExperimentPlatformClient />;
}

import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { UsageClient } from './usage-client';

export default function UsagePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <UsageClient />;
}

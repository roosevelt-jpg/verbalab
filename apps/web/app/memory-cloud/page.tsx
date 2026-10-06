import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { MemoryCloudClient } from './memory-cloud-client';

export default function MemoryCloudPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <MemoryCloudClient />;
}

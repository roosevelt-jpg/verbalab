import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { BenchmarkPlatformClient } from './benchmark-platform-client';

export default function BenchmarkPlatformPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <BenchmarkPlatformClient />;
}

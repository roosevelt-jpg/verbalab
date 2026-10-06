import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { IntelligentCacheClient } from './intelligent-cache-client';

export default function IntelligentCachePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <IntelligentCacheClient />;
}

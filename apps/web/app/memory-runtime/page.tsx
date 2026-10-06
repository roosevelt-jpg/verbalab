import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { MemoryRuntimeClient } from './memory-runtime-client';

export default function MemoryRuntimePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <MemoryRuntimeClient />;
}

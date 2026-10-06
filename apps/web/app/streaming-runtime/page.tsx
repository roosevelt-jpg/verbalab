import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { StreamingRuntimeClient } from './streaming-runtime-client';

export default function StreamingRuntimePage {
  if (!isClerkConfigured) redirect('/setup');
  return <StreamingRuntimeClient />;
}

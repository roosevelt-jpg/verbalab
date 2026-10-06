import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { BatchRuntimeClient } from './batch-runtime-client';

export default function BatchRuntimePage {
  if (!isClerkConfigured) redirect('/setup');
  return <BatchRuntimeClient />;
}

import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ContextRuntimeClient } from './context-runtime-client';

export default function ContextRuntimePage {
  if (!isClerkConfigured) redirect('/setup');
  return <ContextRuntimeClient />;
}

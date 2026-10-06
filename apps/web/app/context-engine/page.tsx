import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ContextEngineClient } from './context-engine-client';

export default function ContextEnginePage {
  if (!isClerkConfigured) redirect('/setup');
  return <ContextEngineClient />;
}

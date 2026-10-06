import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AgentRuntimeClient } from './agent-runtime-client';

export default function AgentRuntimePage {
  if (!isClerkConfigured) redirect('/setup');
  return <AgentRuntimeClient />;
}

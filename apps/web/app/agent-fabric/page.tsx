import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AgentFabricClient } from './agent-fabric-client';

export default function AgentFabricPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AgentFabricClient />;
}

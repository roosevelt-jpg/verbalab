import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AgentMarketplaceClient } from './agent-marketplace-client';

export default function AgentMarketplacePage {
  if (!isClerkConfigured) redirect('/setup');
  return <AgentMarketplaceClient />;
}

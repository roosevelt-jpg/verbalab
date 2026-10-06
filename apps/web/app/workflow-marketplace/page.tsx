import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { WorkflowMarketplaceClient } from './workflow-marketplace-client';

export default function WorkflowMarketplacePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <WorkflowMarketplaceClient />;
}

import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ConnectorMarketplaceClient } from './connector-marketplace-client';

export default function ConnectorMarketplacePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ConnectorMarketplaceClient />;
}

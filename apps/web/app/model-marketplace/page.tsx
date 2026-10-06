import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ModelMarketplaceClient } from './model-marketplace-client';

export default function ModelMarketplacePage {
  if (!isClerkConfigured) redirect('/setup');
  return <ModelMarketplaceClient />;
}

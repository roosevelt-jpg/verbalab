import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { DatasetMarketplaceClient } from './dataset-marketplace-client';

export default function DatasetMarketplacePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <DatasetMarketplaceClient />;
}

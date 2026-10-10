import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { MarketplaceClient } from './marketplace-client';

export default function MarketplacePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <MarketplaceClient />;
}

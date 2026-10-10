import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PluginMarketplaceClient } from './plugin-marketplace-client';

export default function PluginMarketplacePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <PluginMarketplaceClient />;
}

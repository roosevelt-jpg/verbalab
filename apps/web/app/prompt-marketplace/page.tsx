import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PromptMarketplaceClient } from './prompt-marketplace-client';

export default function PromptMarketplacePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <PromptMarketplaceClient />;
}

import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VoiceMarketplaceClient } from './voice-marketplace-client';

export default function VoiceMarketplacePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <VoiceMarketplaceClient />;
}

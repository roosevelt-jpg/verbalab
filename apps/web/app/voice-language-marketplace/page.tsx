import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VoiceLanguageMarketplaceClient } from './voice-language-marketplace-client';

export default function VoiceLanguageMarketplacePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <VoiceLanguageMarketplaceClient />;
}

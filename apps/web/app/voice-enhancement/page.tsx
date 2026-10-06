import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VoiceEnhancementClient } from './voice-enhancement-client';

export default function VoiceEnhancementPage {
  if (!isClerkConfigured) redirect('/setup');
  return <VoiceEnhancementClient />;
}

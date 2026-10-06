import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VoiceStudioClient } from './voice-studio-client';

export default function VoiceStudioPage {
  if (!isClerkConfigured) redirect('/setup');
  return <VoiceStudioClient />;
}

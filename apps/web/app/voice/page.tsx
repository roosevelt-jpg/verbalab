import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VoiceClient } from './voice-client';

export default function VoicePage {
  if (!isClerkConfigured) redirect('/setup');
  return <VoiceClient />;
}

import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { EmotionVoiceClient } from './emotion-voice-client';

export default function EmotionVoicePage {
  if (!isClerkConfigured) redirect('/setup');
  return <EmotionVoiceClient />;
}

import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { SpeechClient } from './speech-client';

export default function SpeechPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <SpeechClient />;
}

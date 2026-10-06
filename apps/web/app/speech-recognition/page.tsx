import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { SpeechRecognitionClient } from './speech-recognition-client';

export default function SpeechRecognitionPage {
  if (!isClerkConfigured) redirect('/setup');
  return <SpeechRecognitionClient />;
}

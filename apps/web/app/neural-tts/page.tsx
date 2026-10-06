import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { NeuralTtsClient } from './neural-tts-client';

export default function NeuralTtsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <NeuralTtsClient />;
}

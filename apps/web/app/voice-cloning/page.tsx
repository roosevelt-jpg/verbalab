import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VoiceCloningClient } from './voice-cloning-client';

export default function VoiceCloningPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <VoiceCloningClient />;
}

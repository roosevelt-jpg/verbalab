import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VoiceDataClient } from './voice-data-client';

export default function AdminVoiceDataPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <VoiceDataClient />;
}

import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VoiceBiometricsClient } from './voice-biometrics-client';

export default function VoiceBiometricsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <VoiceBiometricsClient />;
}

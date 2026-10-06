import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VoiceCloudClient } from './voice-cloud-client';

export default function VoiceCloudPage {
  if (!isClerkConfigured) redirect('/setup');
  return <VoiceCloudClient />;
}

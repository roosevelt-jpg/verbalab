import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VoiceAnalyticsClient } from './voice-analytics-client';

export default function VoiceAnalyticsPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <VoiceAnalyticsClient />;
}

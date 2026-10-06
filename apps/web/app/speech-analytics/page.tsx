import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { SpeechAnalyticsClient } from './speech-analytics-client';

export default function SpeechAnalyticsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <SpeechAnalyticsClient />;
}

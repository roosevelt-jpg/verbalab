import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AiRuntimeAnalyticsClient } from './ai-runtime-analytics-client';

export default function AiRuntimeAnalyticsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <AiRuntimeAnalyticsClient />;
}

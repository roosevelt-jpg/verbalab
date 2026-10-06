import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { IntelligenceAnalyticsClient } from './intelligence-analytics-client';

export default function IntelligenceAnalyticsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <IntelligenceAnalyticsClient />;
}

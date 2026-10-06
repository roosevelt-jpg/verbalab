import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ResearchAnalyticsClient } from './research-analytics-client';

export default function ResearchAnalyticsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <ResearchAnalyticsClient />;
}

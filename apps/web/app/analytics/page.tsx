import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AnalyticsClient } from './analytics-client';

export default function AnalyticsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <AnalyticsClient />;
}

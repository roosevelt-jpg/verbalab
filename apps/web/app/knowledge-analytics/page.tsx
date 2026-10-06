import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { KnowledgeAnalyticsClient } from './knowledge-analytics-client';

export default function KnowledgeAnalyticsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <KnowledgeAnalyticsClient />;
}

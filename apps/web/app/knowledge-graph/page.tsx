import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { KnowledgeGraphClient } from './knowledge-graph-client';

export default function KnowledgeGraphPage {
  if (!isClerkConfigured) redirect('/setup');
  return <KnowledgeGraphClient />;
}

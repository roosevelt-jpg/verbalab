import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { KnowledgeApisClient } from './knowledge-apis-client';

export default function KnowledgeApisPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <KnowledgeApisClient />;
}

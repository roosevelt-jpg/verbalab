import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { KnowledgeMemoryClient } from './knowledge-memory-client';

export default function KnowledgeMemoryPage {
  if (!isClerkConfigured) redirect('/setup');
  return <KnowledgeMemoryClient />;
}

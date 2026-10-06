import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { KnowledgeClient } from './knowledge-client';

export default function KnowledgePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <KnowledgeClient />;
}

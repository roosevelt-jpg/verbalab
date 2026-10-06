import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { KnowledgeBaseClient } from './knowledge-base-client';

export default function KnowledgeBasePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <KnowledgeBaseClient />;
}

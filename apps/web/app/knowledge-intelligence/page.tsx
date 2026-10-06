import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { KnowledgeIntelligenceClient } from './knowledge-intelligence-client';

export default function KnowledgeIntelligencePage {
  if (!isClerkConfigured) redirect('/setup');
  return <KnowledgeIntelligenceClient />;
}

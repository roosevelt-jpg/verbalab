import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AfricanKnowledgeGraphClient } from './african-knowledge-graph-client';

export default function AfricanKnowledgeGraphPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AfricanKnowledgeGraphClient />;
}

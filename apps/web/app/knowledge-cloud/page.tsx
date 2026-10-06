import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { KnowledgeCloudClient } from './knowledge-cloud-client';

export default function KnowledgeCloudPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <KnowledgeCloudClient />;
}

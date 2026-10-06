import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { KnowledgeFabricClient } from './knowledge-fabric-client';

export default function KnowledgeFabricPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <KnowledgeFabricClient />;
}

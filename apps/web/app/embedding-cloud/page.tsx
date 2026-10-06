import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { EmbeddingCloudClient } from './embedding-cloud-client';

export default function EmbeddingCloudPage {
  if (!isClerkConfigured) redirect('/setup');
  return <EmbeddingCloudClient />;
}

import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { DocumentsClient } from './documents-client';

export default function DocumentsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <DocumentsClient />;
}

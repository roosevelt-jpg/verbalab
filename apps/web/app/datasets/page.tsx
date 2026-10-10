import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { DatasetsClient } from './datasets-client';

export default function DatasetsPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <DatasetsClient />;
}

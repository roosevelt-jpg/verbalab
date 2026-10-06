import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { TaxonomyClient } from './taxonomy-client';

export default function TaxonomyPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <TaxonomyClient />;
}

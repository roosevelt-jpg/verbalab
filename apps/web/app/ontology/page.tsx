import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { OntologyClient } from './ontology-client';

export default function OntologyPage {
  if (!isClerkConfigured) redirect('/setup');
  return <OntologyClient />;
}

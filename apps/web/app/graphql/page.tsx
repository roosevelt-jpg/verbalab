import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { GraphqlClient } from './graphql-client';

export default function GraphqlPage {
  if (!isClerkConfigured) redirect('/setup');
  return <GraphqlClient />;
}

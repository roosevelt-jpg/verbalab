import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PolicyFabricClient } from './policy-fabric-client';

export default function PolicyFabricPage {
  if (!isClerkConfigured) redirect('/setup');
  return <PolicyFabricClient />;
}

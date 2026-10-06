import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ContextFabricClient } from './context-fabric-client';

export default function ContextFabricPage {
  if (!isClerkConfigured) redirect('/setup');
  return <ContextFabricClient />;
}

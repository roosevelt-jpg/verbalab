import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { MemoryFabricClient } from './memory-fabric-client';

export default function MemoryFabricPage {
  if (!isClerkConfigured) redirect('/setup');
  return <MemoryFabricClient />;
}

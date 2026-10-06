import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AiFabricClient } from './ai-fabric-client';

export default function AiFabricPage {
  if (!isClerkConfigured) redirect('/setup');
  return <AiFabricClient />;
}

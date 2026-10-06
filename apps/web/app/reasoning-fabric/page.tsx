import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ReasoningFabricClient } from './reasoning-fabric-client';

export default function ReasoningFabricPage {
  if (!isClerkConfigured) redirect('/setup');
  return <ReasoningFabricClient />;
}

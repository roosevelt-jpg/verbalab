import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PromptFabricClient } from './prompt-fabric-client';

export default function PromptFabricPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <PromptFabricClient />;
}

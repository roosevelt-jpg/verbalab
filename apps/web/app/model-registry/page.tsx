import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ModelRegistryClient } from './model-registry-client';

export default function ModelRegistryPage {
  if (!isClerkConfigured) redirect('/setup');
  return <ModelRegistryClient />;
}

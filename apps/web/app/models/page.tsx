import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ModelsClient } from './models-client';

export default function ModelsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <ModelsClient />;
}

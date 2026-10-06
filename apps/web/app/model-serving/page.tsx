import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ModelServingClient } from './model-serving-client';

export default function ModelServingPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ModelServingClient />;
}

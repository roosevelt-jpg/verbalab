import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ReasoningRuntimeClient } from './reasoning-runtime-client';

export default function ReasoningRuntimePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ReasoningRuntimeClient />;
}

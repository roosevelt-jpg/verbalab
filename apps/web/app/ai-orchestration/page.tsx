import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AiOrchestrationClient } from './ai-orchestration-client';

export default function AiOrchestrationPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AiOrchestrationClient />;
}

import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { WorkflowsClient } from './workflows-client';

export default function WorkflowsPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <WorkflowsClient />;
}

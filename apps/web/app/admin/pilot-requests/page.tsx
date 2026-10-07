import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PilotRequestsClient } from './pilot-requests-client';

export default function AdminPilotRequestsPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <PilotRequestsClient />;
}

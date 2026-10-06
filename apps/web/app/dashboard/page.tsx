import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { DashboardClient } from './dashboard-client';

export default function DashboardPage {
  if (!isClerkConfigured) redirect('/setup');
  return <DashboardClient />;
}

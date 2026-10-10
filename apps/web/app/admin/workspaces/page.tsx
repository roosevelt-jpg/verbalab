import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AdminWorkspacesClient } from './admin-workspaces-client';

export default function AdminWorkspacesPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AdminWorkspacesClient />;
}

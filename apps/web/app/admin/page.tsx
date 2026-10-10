import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AdminClient } from './admin-client';

export default function AdminPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AdminClient />;
}

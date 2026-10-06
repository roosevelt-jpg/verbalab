import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AuditClient } from './audit-client';

export default function AuditPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AuditClient />;
}

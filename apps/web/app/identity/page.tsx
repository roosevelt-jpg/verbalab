import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { IdentityClient } from './identity-client';

export default function IdentityPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <IdentityClient />;
}

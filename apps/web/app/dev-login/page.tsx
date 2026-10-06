import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { DevLoginClient } from './dev-login-client';

export default function DevLoginPage {
  if (!isClerkConfigured) redirect('/setup');
  return <DevLoginClient />;
}

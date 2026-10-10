import { redirect } from 'next/navigation';
import { isClerkConfigured, isClerkGoogleOAuthEnabled } from '@/lib/clerk-config';
import { SignUpClient } from './sign-up-client';

export default function SignUpPage() {
  if (!isClerkConfigured()) redirect('/setup');

  const hasSocial = isClerkGoogleOAuthEnabled();

  return <SignUpClient hasSocial={hasSocial} />;
}

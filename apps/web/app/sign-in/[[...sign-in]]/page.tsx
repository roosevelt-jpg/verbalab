import { redirect } from 'next/navigation';
import { isClerkConfigured, isClerkGoogleOAuthEnabled } from '@/lib/clerk-config';
import { SignInClient } from './sign-in-client';

export default function SignInPage() {
  if (!isClerkConfigured()) redirect('/setup');

  const hasSocial = isClerkGoogleOAuthEnabled();

  return <SignInClient hasSocial={hasSocial} />;
}

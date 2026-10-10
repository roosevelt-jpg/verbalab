import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isClerkConfigured, isClerkGoogleOAuthEnabled } from '@/lib/clerk-config';
import { buildCmsMetadata } from '@/lib/cms-seo';
import { SignInClient } from './sign-in-client';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/sign-in', {
    fallbackTitle: 'Sign in',
    fallbackDescription: 'Sign in to Lugemi Creative, Agents, and the developer console.',
  });
}

export default function SignInPage() {
  if (!isClerkConfigured()) redirect('/setup');

  const hasSocial = isClerkGoogleOAuthEnabled();

  return <SignInClient hasSocial={hasSocial} />;
}

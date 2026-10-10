import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isClerkConfigured, isClerkGoogleOAuthEnabled } from '@/lib/clerk-config';
import { buildCmsMetadata } from '@/lib/cms-seo';
import { SignUpClient } from './sign-up-client';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/sign-up', {
    fallbackTitle: 'Sign up',
    fallbackDescription: 'Create your Lugemi account and start building speaking agents.',
  });
}

export default function SignUpPage() {
  if (!isClerkConfigured()) redirect('/setup');

  const hasSocial = isClerkGoogleOAuthEnabled();

  return <SignUpClient hasSocial={hasSocial} />;
}

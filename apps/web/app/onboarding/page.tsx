import type { Metadata } from 'next';
import { Suspense } from 'react';
import { buildCmsMetadata } from '@/lib/cms-seo';
import { OnboardingClient } from './onboarding-client';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/onboarding', {
    fallbackTitle: 'Welcome',
    fallbackDescription:
      'Choose LugemiCreative or LugemiAgents, personalize your workspace, pick a persona, and select Free, Pro, Business, or Enterprise.',
  });
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem', color: 'var(--muted)' }}>Loading…</p>}>
      <OnboardingClient />
    </Suspense>
  );
}

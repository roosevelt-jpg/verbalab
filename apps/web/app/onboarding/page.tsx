import type { Metadata } from 'next';
import { OnboardingClient } from './onboarding-client';

export const metadata: Metadata = {
  title: 'Onboarding',
  description:
    'Choose LugemiCreative or LugemiAgents, personalize your workspace, pick a persona, and select Free, Pro, Business, or Enterprise.',
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}

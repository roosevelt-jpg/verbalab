import type { ReactNode } from 'react';
import { OnboardingResumeGate } from '@/components/auth/onboarding-resume-gate';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <OnboardingResumeGate>{children}</OnboardingResumeGate>;
}

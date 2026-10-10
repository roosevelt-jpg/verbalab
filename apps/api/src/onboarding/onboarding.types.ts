export type OnboardingPlatform = 'creative' | 'agents';

export type OnboardingPersona =
  | 'personal'
  | 'engineer'
  | 'product'
  | 'sales'
  | 'customer_support'
  | 'marketer'
  | 'education'
  | 'other';

export type OnboardingPlanId = 'free' | 'pro' | 'business' | 'enterprise';

export type OnboardingBillingInterval = 'monthly' | 'yearly';

export type OnboardingProfile = {
  platform: OnboardingPlatform | null;
  displayName: string | null;
  preferredLanguage: string | null;
  referralSource: string | null;
  ageConfirmed: boolean;
  persona: OnboardingPersona | null;
  planId: OnboardingPlanId | null;
  billingInterval: OnboardingBillingInterval;
  completed: boolean;
  completedAt: string | null;
  step: number;
};

export const EMPTY_ONBOARDING: OnboardingProfile = {
  platform: null,
  displayName: null,
  preferredLanguage: null,
  referralSource: null,
  ageConfirmed: false,
  persona: null,
  planId: null,
  billingInterval: 'monthly',
  completed: false,
  completedAt: null,
  step: 0,
};

export const ONBOARDING_PLATFORMS: OnboardingPlatform[] = ['creative', 'agents'];
export const ONBOARDING_PERSONAS: OnboardingPersona[] = [
  'personal',
  'engineer',
  'product',
  'sales',
  'customer_support',
  'marketer',
  'education',
  'other',
];
export const ONBOARDING_PLAN_IDS: OnboardingPlanId[] = [
  'free',
  'pro',
  'business',
  'enterprise',
];

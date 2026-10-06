/** Client onboarding profile + localStorage helpers. */

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

export type OnboardingState = {
  platform: OnboardingPlatform | null;
  displayName: string;
  preferredLanguage: string;
  referralSource: string;
  ageConfirmed: boolean;
  persona: OnboardingPersona | null;
  planId: OnboardingPlanId | null;
  billingInterval: OnboardingBillingInterval;
  completed: boolean;
  step: number;
};

export const ONBOARDING_STORAGE_KEY = 'lugemi.onboarding.v1';

export const EMPTY_ONBOARDING_STATE: OnboardingState = {
  platform: null,
  displayName: '',
  preferredLanguage: 'en',
  referralSource: '',
  ageConfirmed: false,
  persona: null,
  planId: null,
  billingInterval: 'monthly',
  completed: false,
  step: 0,
};

export const PLATFORM_CARDS: {
  id: OnboardingPlatform;
  title: string;
  tagline: string;
  features: { label: string; icon: string }[];
}[] = [
  {
    id: 'creative',
    title: 'LugemiCreative',
    tagline: 'Create, edit, and localize content with AI',
    features: [
      { label: 'Text to Speech', icon: 'tts' },
      { label: 'Sound Effects', icon: 'sfx' },
      { label: 'Studio', icon: 'studio' },
      { label: 'Speech to Text', icon: 'stt' },
      { label: 'Image & Video', icon: 'media' },
      { label: 'Voice Changer', icon: 'changer' },
      { label: 'Voice Isolator', icon: 'isolator' },
      { label: 'Dubbing', icon: 'dub' },
      { label: 'Music', icon: 'music' },
      { label: 'Flows', icon: 'flows' },
    ],
  },
  {
    id: 'agents',
    title: 'LugemiAgents',
    tagline: 'Build conversational agents for voice, chat, and phone',
    features: [
      { label: 'Agents', icon: 'agents' },
      { label: 'Tools', icon: 'tools' },
      { label: 'Integrations', icon: 'integrations' },
      { label: 'Outbound', icon: 'outbound' },
      { label: 'Knowledge Base', icon: 'kb' },
      { label: 'Conversations', icon: 'conversations' },
      { label: 'Phone numbers', icon: 'phone' },
    ],
  },
];

export const PERSONA_CARDS: { id: OnboardingPersona; label: string; icon: string }[] = [
  { id: 'personal', label: 'Personal use', icon: 'spark' },
  { id: 'engineer', label: 'Engineer', icon: 'code' },
  { id: 'product', label: 'Product', icon: 'briefcase' },
  { id: 'sales', label: 'Sales', icon: 'rocket' },
  { id: 'customer_support', label: 'Customer Support', icon: 'headset' },
  { id: 'marketer', label: 'Marketer', icon: 'store' },
  { id: 'education', label: 'Education', icon: 'grad' },
  { id: 'other', label: 'Other', icon: 'more' },
];

export function loadOnboardingLocal(): OnboardingState {
  if (typeof window === 'undefined') return { ...EMPTY_ONBOARDING_STATE };
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return { ...EMPTY_ONBOARDING_STATE };
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return { ...EMPTY_ONBOARDING_STATE, ...parsed };
  } catch {
    return { ...EMPTY_ONBOARDING_STATE };
  }
}

export function saveOnboardingLocal(state: OnboardingState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export function destinationForPlatform(platform: OnboardingPlatform | null): string {
  return platform === 'agents' ? '/chat' : '/dashboard';
}

import { describe, expect, it } from 'vitest';
import {
  parseOnboardingStatusCookie,
  shouldForceOnboardingFromCookie,
} from './onboarding-status';

describe('onboarding status cookie', () => {
  it('parses pending and done only', () => {
    expect(parseOnboardingStatusCookie('pending')).toBe('pending');
    expect(parseOnboardingStatusCookie('done')).toBe('done');
    expect(parseOnboardingStatusCookie(undefined)).toBeNull();
    expect(parseOnboardingStatusCookie('other')).toBeNull();
  });

  it('forces onboarding only while pending', () => {
    expect(shouldForceOnboardingFromCookie('pending')).toBe(true);
    expect(shouldForceOnboardingFromCookie('done')).toBe(false);
    expect(shouldForceOnboardingFromCookie(null)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  isPlatformAdminFromCookie,
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

  it('recognizes platform admin cookie', () => {
    expect(isPlatformAdminFromCookie('1')).toBe(true);
    expect(isPlatformAdminFromCookie('true')).toBe(true);
    expect(isPlatformAdminFromCookie('0')).toBe(false);
    expect(isPlatformAdminFromCookie(null)).toBe(false);
    expect(isPlatformAdminFromCookie(undefined)).toBe(false);
  });
});

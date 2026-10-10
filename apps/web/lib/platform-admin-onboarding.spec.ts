import { describe, expect, it } from 'vitest';
import {
  isPlatformAdminFromCookie,
  parseOnboardingStatusCookie,
  setPlatformAdminCookie,
  shouldForceOnboardingFromCookie,
} from './onboarding-status';

describe('platform admin skip onboarding', () => {
  it('correctly parses platform admin cookie values', () => {
    expect(isPlatformAdminFromCookie('1')).toBe(true);
    expect(isPlatformAdminFromCookie('true')).toBe(true);
    expect(isPlatformAdminFromCookie('0')).toBe(false);
    expect(isPlatformAdminFromCookie('false')).toBe(false);
    expect(isPlatformAdminFromCookie(null)).toBe(false);
    expect(isPlatformAdminFromCookie(undefined)).toBe(false);
  });

  it('sets platform admin cookie when in document context', () => {
    // Should not throw even in non-browser or test env
    expect(() => setPlatformAdminCookie(true)).not.toThrow();
    expect(() => setPlatformAdminCookie(false)).not.toThrow();
  });

  it('preserves normal user onboarding checks', () => {
    expect(shouldForceOnboardingFromCookie('pending')).toBe(true);
    expect(shouldForceOnboardingFromCookie('done')).toBe(false);
    expect(parseOnboardingStatusCookie('pending')).toBe('pending');
    expect(parseOnboardingStatusCookie('done')).toBe('done');
  });
});

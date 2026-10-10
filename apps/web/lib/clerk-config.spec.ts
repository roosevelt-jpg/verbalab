import { afterEach, describe, expect, it } from 'vitest';
import { isClerkGoogleOAuthEnabled } from './clerk-config';

describe('isClerkGoogleOAuthEnabled', () => {
  const prevGoogle = process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED;
  const prevEnable = process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE;

  afterEach(() => {
    if (prevGoogle === undefined) {
      delete process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED = prevGoogle;
    }
    if (prevEnable === undefined) {
      delete process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE;
    } else {
      process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE = prevEnable;
    }
  });

  it('returns false when NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED is unconfigured', () => {
    delete process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED;
    delete process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE;
    expect(isClerkGoogleOAuthEnabled()).toBe(false);
  });

  it('returns false when NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED is false or 0', () => {
    process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED = 'false';
    expect(isClerkGoogleOAuthEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED = '0';
    expect(isClerkGoogleOAuthEnabled()).toBe(false);
  });

  it('returns true when NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED is true and enable is not false', () => {
    process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED = 'true';
    delete process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE;
    expect(isClerkGoogleOAuthEnabled()).toBe(true);
  });

  it('returns false if NEXT_PUBLIC_CLERK_ENABLE_GOOGLE is false even if enabled is true', () => {
    process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED = 'true';
    process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE = 'false';
    expect(isClerkGoogleOAuthEnabled()).toBe(false);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { isClerkGoogleOAuthEnabled } from './clerk-config';

describe('isClerkGoogleOAuthEnabled', () => {
  const prevGoogle = process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED;
  const prevEnable = process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE;
  const prevFbKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const prevFbDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const prevFbProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const prevFbGoogle = process.env.NEXT_PUBLIC_FIREBASE_GOOGLE_OAUTH_ENABLED;

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
    if (prevFbKey === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    else process.env.NEXT_PUBLIC_FIREBASE_API_KEY = prevFbKey;
    if (prevFbDomain === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    else process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = prevFbDomain;
    if (prevFbProject === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = prevFbProject;
    if (prevFbGoogle === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_GOOGLE_OAUTH_ENABLED;
    else process.env.NEXT_PUBLIC_FIREBASE_GOOGLE_OAUTH_ENABLED = prevFbGoogle;
  });

  function clearFirebase() {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_GOOGLE_OAUTH_ENABLED;
  }

  it('returns false when NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED is unconfigured', () => {
    clearFirebase();
    delete process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED;
    delete process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE;
    expect(isClerkGoogleOAuthEnabled()).toBe(false);
  });

  it('returns false when NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED is false or 0', () => {
    clearFirebase();
    process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED = 'false';
    expect(isClerkGoogleOAuthEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED = '0';
    expect(isClerkGoogleOAuthEnabled()).toBe(false);
  });

  it('returns true when NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED is true and enable is not false', () => {
    clearFirebase();
    process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED = 'true';
    delete process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE;
    expect(isClerkGoogleOAuthEnabled()).toBe(true);
  });

  it('returns false if NEXT_PUBLIC_CLERK_ENABLE_GOOGLE is false even if enabled is true', () => {
    clearFirebase();
    process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED = 'true';
    process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE = 'false';
    expect(isClerkGoogleOAuthEnabled()).toBe(false);
  });

  it('defaults Google on when Firebase is configured', () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test';
    delete process.env.NEXT_PUBLIC_FIREBASE_GOOGLE_OAUTH_ENABLED;
    expect(isClerkGoogleOAuthEnabled()).toBe(true);
  });
});

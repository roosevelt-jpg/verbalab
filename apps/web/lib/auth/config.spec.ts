import { afterEach, describe, expect, it } from 'vitest';
import { authBackend, isFirebaseConfigured } from './config';

describe('authBackend', () => {
  const keys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  ] as const;
  const prev: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  function snap() {
    for (const k of keys) prev[k] = process.env[k];
  }

  it('prefers firebase when configured even if Clerk is also set', () => {
    snap();
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'AIza';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'lugemi.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'lugemi';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_live_x';
    expect(isFirebaseConfigured()).toBe(true);
    expect(authBackend()).toBe('firebase');
  });

  it('falls back to clerk when firebase is unset', () => {
    snap();
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_live_x';
    expect(authBackend()).toBe('clerk');
  });
});

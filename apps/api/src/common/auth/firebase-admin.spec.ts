import { afterEach, describe, expect, it } from 'vitest';
import { isFirebaseAdminConfigured } from './firebase-admin';

describe('isFirebaseAdminConfigured', () => {
  const keys = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'GOOGLE_APPLICATION_CREDENTIALS',
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

  it('is true with service account env', () => {
    snap();
    process.env.FIREBASE_PROJECT_ID = 'lugemi';
    process.env.FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk@lugemi.iam.gserviceaccount.com';
    process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n';
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    expect(isFirebaseAdminConfigured()).toBe(true);
  });

  it('is false when unset', () => {
    snap();
    for (const k of keys) delete process.env[k];
    expect(isFirebaseAdminConfigured()).toBe(false);
  });
});

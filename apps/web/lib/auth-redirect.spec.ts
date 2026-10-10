import { afterEach, describe, expect, it } from 'vitest';
import {
  afterClerkAuthPath,
  ONBOARDING_SKIP_PATH,
  POST_AUTH_PATH,
} from './auth-redirect';

describe('afterClerkAuthPath', () => {
  const previous = process.env.NEXT_PUBLIC_SKIP_ONBOARDING;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_SKIP_ONBOARDING;
    } else {
      process.env.NEXT_PUBLIC_SKIP_ONBOARDING = previous;
    }
  });

  it('sends users to post-auth gate by default (admin check before onboarding UI)', () => {
    delete process.env.NEXT_PUBLIC_SKIP_ONBOARDING;
    expect(afterClerkAuthPath()).toBe(POST_AUTH_PATH);
  });

  it('honors NEXT_PUBLIC_SKIP_ONBOARDING for local/dev skip', () => {
    process.env.NEXT_PUBLIC_SKIP_ONBOARDING = '1';
    expect(afterClerkAuthPath()).toBe(ONBOARDING_SKIP_PATH);
  });
});

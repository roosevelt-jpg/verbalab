import { describe, expect, it } from 'vitest';
import {
  LIVE_CLERK_LOCAL_ORIGIN,
  isBareLocalDevHost,
  isLiveClerkPublishableKey,
  liveClerkLocalUrl,
  mustUseLiveClerkLocalOrigin,
} from './live-clerk-local-origin';

describe('live-clerk-local-origin', () => {
  it('detects live publishable keys', () => {
    expect(isLiveClerkPublishableKey('pk_live_abc')).toBe(true);
    expect(isLiveClerkPublishableKey('pk_test_abc')).toBe(false);
    expect(isLiveClerkPublishableKey('')).toBe(false);
  });

  it('detects bare local hosts', () => {
    expect(isBareLocalDevHost('127.0.0.1')).toBe(true);
    expect(isBareLocalDevHost('127.0.0.1:43125')).toBe(true);
    expect(isBareLocalDevHost('localhost:43125')).toBe(true);
    expect(isBareLocalDevHost('local.lugemi.com')).toBe(false);
    expect(isBareLocalDevHost('local.lugemi.com:443')).toBe(false);
  });

  it('requires local.lugemi.com only for live keys on bare hosts', () => {
    expect(
      mustUseLiveClerkLocalOrigin({
        publishableKey: 'pk_live_x',
        hostHeader: '127.0.0.1:43125',
      }),
    ).toBe(true);
    expect(
      mustUseLiveClerkLocalOrigin({
        publishableKey: 'pk_live_x',
        hostHeader: 'local.lugemi.com',
      }),
    ).toBe(false);
    expect(
      mustUseLiveClerkLocalOrigin({
        publishableKey: 'pk_test_x',
        hostHeader: '127.0.0.1:43125',
      }),
    ).toBe(false);
  });

  it('builds https local login URLs', () => {
    expect(liveClerkLocalUrl('/dev-login')).toBe(`${LIVE_CLERK_LOCAL_ORIGIN}/dev-login`);
  });
});

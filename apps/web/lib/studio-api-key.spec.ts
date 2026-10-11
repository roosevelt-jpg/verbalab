import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyStudioApiKey,
  clearStudioApiKey,
  formatStudioApiKeyLabel,
  isLugemiApiKey,
  loadStudioApiKeyIdentity,
  loadStudioApiKeySecret,
  resolveWorkspaceBearer,
} from './studio-api-key';

describe('studio-api-key', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
    vi.stubGlobal('window', {
      localStorage: globalThis.localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('recognizes Lugemi key prefixes', () => {
    expect(isLugemiApiKey('lg_live_abc')).toBe(true);
    expect(isLugemiApiKey('lg_test_abc')).toBe(true);
    expect(isLugemiApiKey('pk_live_abc')).toBe(false);
  });

  it('applies and loads a live key identity for Studio', () => {
    const secret = 'lg_live_DwGg2oQJexampleSecret';
    applyStudioApiKey({
      id: 'key_1',
      name: 'Default',
      prefix: 'lg_live_DwGg2oQJ',
      environment: 'live',
      secret,
    });
    expect(loadStudioApiKeySecret()).toBe(secret);
    const identity = loadStudioApiKeyIdentity();
    expect(identity?.name).toBe('Default');
    expect(identity?.environment).toBe('live');
    expect(identity?.prefix).toBe('lg_live_DwGg2oQJ');
    expect(formatStudioApiKeyLabel(identity)).toContain('Default');
    expect(formatStudioApiKeyLabel(identity)).toContain('live');
  });

  it('clears Studio identity', () => {
    applyStudioApiKey({
      id: 'key_1',
      name: 'Default',
      prefix: 'lg_live_DwGg2oQJ',
      environment: 'live',
      secret: 'lg_live_DwGg2oQJexampleSecret',
    });
    clearStudioApiKey();
    expect(loadStudioApiKeySecret()).toBe('');
    expect(loadStudioApiKeyIdentity()).toBeNull();
  });

  it('migrates legacy Creative localStorage secret', () => {
    window.localStorage.setItem('lugemi.creative.apiKey.v1', 'lg_test_legacyCreativeKey');
    expect(loadStudioApiKeySecret()).toBe('lg_test_legacyCreativeKey');
  });

  it('resolveWorkspaceBearer prefers applied machine key over Clerk session', async () => {
    applyStudioApiKey({
      id: 'key_1',
      name: 'Default',
      prefix: 'lg_live_DwGg2oQJ',
      environment: 'live',
      secret: 'lg_live_DwGg2oQJexampleSecret',
    });
    const session = vi.fn(async () => 'clerk_session_jwt');
    await expect(resolveWorkspaceBearer(session)).resolves.toBe('lg_live_DwGg2oQJexampleSecret');
    expect(session).not.toHaveBeenCalled();
  });

  it('resolveWorkspaceBearer falls back to Clerk when no machine key is applied', async () => {
    await expect(resolveWorkspaceBearer(async () => 'clerk_session_jwt')).resolves.toBe(
      'clerk_session_jwt',
    );
  });

  it('resolveWorkspaceBearer prefers an override key', async () => {
    applyStudioApiKey({
      id: 'key_1',
      name: 'Default',
      prefix: 'lg_live_DwGg2oQJ',
      environment: 'live',
      secret: 'lg_live_DwGg2oQJexampleSecret',
    });
    await expect(
      resolveWorkspaceBearer(async () => 'clerk_session_jwt', 'lg_test_overrideKey'),
    ).resolves.toBe('lg_test_overrideKey');
  });
});

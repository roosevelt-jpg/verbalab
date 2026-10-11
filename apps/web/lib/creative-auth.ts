/** Shared Creative workspace auth: applied lg_* machine key, then Clerk session. */

import {
  applyStudioApiKey,
  clearStudioApiKey,
  isLugemiApiKey,
  loadStudioApiKeySecret,
  resolveWorkspaceBearer,
} from '@/lib/studio-api-key';

export { isLugemiApiKey, resolveWorkspaceBearer } from '@/lib/studio-api-key';

export function loadCreativeApiKey(): string {
  return loadStudioApiKeySecret();
}

export function saveCreativeApiKey(value: string) {
  const next = value.trim();
  if (!next) {
    clearStudioApiKey();
    return;
  }
  if (!isLugemiApiKey(next)) return;
  const existingPrefix = next.slice(0, 16);
  applyStudioApiKey({
    id: '',
    name: next.startsWith('lg_live_') || next.startsWith('vl_live_') ? 'Live key' : 'Test key',
    prefix: existingPrefix,
    environment: next.startsWith('lg_test_') || next.startsWith('vl_test_') ? 'test' : 'live',
    secret: next,
  });
}

/** Creative tools: applied Studio key first, then Clerk. */
export async function resolveCreativeToken(
  getSessionToken?: () => Promise<string | null | undefined>,
  overrideKey?: string,
): Promise<string | null> {
  return resolveWorkspaceBearer(getSessionToken, overrideKey);
}

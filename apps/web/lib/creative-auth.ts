/** Shared Creative workspace auth: Clerk session or pasted lg_* API key. */

import {
  applyStudioApiKey,
  clearStudioApiKey,
  isLugemiApiKey,
  loadStudioApiKeySecret,
} from '@/lib/studio-api-key';

export { isLugemiApiKey } from '@/lib/studio-api-key';

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

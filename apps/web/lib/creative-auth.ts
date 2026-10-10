/** Shared Creative workspace auth: Clerk session or pasted lg_* API key. */

const KEY = 'lugemi.creative.apiKey.v1';

export function loadCreativeApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveCreativeApiKey(value: string) {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function isLugemiApiKey(value: string): boolean {
  return (
    value.startsWith('lg_live_') ||
    value.startsWith('lg_test_') ||
    value.startsWith('vl_live_') ||
    value.startsWith('vl_test_')
  );
}

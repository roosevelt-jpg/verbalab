'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  applyStudioApiKey,
  clearStudioApiKey,
  isLugemiApiKey,
  loadStudioApiKeyIdentity,
  loadStudioApiKeySecret,
  subscribeStudioApiKey,
  type StudioApiKeyIdentity,
} from '@/lib/studio-api-key';

/** Bind a paste field to the Studio-wide machine API key identity. */
export function useStudioApiKeyField(initial = '') {
  const [apiKey, setApiKeyState] = useState(initial);
  const [identity, setIdentity] = useState<StudioApiKeyIdentity | null>(null);

  const sync = useCallback(() => {
    setApiKeyState(loadStudioApiKeySecret());
    setIdentity(loadStudioApiKeyIdentity());
  }, []);

  useEffect(() => {
    sync();
    return subscribeStudioApiKey(sync);
  }, [sync]);

  const setApiKey = useCallback((value: string) => {
    const next = value.trim();
    setApiKeyState(next);
    if (!next) {
      clearStudioApiKey();
      setIdentity(null);
      return;
    }
    if (!isLugemiApiKey(next)) return;
    const existing = loadStudioApiKeyIdentity();
    const applied = applyStudioApiKey({
      id: existing && next.startsWith(existing.prefix) ? existing.id : '',
      name:
        existing && next.startsWith(existing.prefix)
          ? existing.name
          : next.startsWith('lg_live_') || next.startsWith('vl_live_')
            ? 'Live key'
            : 'Test key',
      prefix: existing && next.startsWith(existing.prefix) ? existing.prefix : next.slice(0, 16),
      environment:
        existing && next.startsWith(existing.prefix)
          ? existing.environment
          : next.startsWith('lg_test_') || next.startsWith('vl_test_')
            ? 'test'
            : 'live',
      secret: next,
    });
    setIdentity(applied);
  }, []);

  return { apiKey, setApiKey, identity };
}

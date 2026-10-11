'use client';

import { useEffect } from 'react';
import { useStudioApiKeyField } from '@/hooks/use-studio-api-key';
import { isLugemiApiKey } from '@/lib/creative-auth';

/** Compact API key field for Creative tools when Clerk is absent or as override. */
export function CreativeApiKeyField({
  onChange,
  compact = false,
}: {
  onChange?: (key: string) => void;
  compact?: boolean;
}) {
  const { apiKey, setApiKey, identity } = useStudioApiKeyField();

  useEffect(() => {
    onChange?.(apiKey);
    // Parent onChange often recreates each render (e.g. tick bumpers) — sync on apiKey only.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [apiKey]);

  return (
    <label className="lg-creative-field-block" style={compact ? { marginBottom: 0 } : undefined}>
      <span>
        API key{' '}
        {isLugemiApiKey(apiKey)
          ? `· ${identity ? `${identity.name} (${identity.environment})` : 'ready'}`
          : '(lg_test_… / lg_live_…)'}
      </span>
      <input
        type="password"
        autoComplete="off"
        placeholder="lg_test_… or lg_live_…"
        value={apiKey}
        onChange={(e) => {
          const v = e.target.value.trim();
          setApiKey(v);
          onChange?.(v);
        }}
        aria-label="Lugemi API key"
      />
    </label>
  );
}

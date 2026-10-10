'use client';

import { useEffect, useState } from 'react';
import { isLugemiApiKey, loadCreativeApiKey, saveCreativeApiKey } from '@/lib/creative-auth';

/** Compact API key field for Creative tools when Clerk is absent or as override. */
export function CreativeApiKeyField({
  onChange,
  compact = false,
}: {
  onChange?: (key: string) => void;
  compact?: boolean;
}) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const saved = loadCreativeApiKey();
    setApiKey(saved);
    onChange?.(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  return (
    <label className="lg-creative-field-block" style={compact ? { marginBottom: 0 } : undefined}>
      <span>API key {isLugemiApiKey(apiKey) ? '· ready' : '(lg_test_… for local)'}</span>
      <input
        type="password"
        autoComplete="off"
        placeholder="lg_test_… or lg_live_…"
        value={apiKey}
        onChange={(e) => {
          const v = e.target.value.trim();
          setApiKey(v);
          saveCreativeApiKey(v);
          onChange?.(v);
        }}
        aria-label="Lugemi API key"
      />
    </label>
  );
}

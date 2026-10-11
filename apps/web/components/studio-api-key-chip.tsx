'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  formatStudioApiKeyLabel,
  loadStudioApiKeyIdentity,
  subscribeStudioApiKey,
  type StudioApiKeyIdentity,
} from '@/lib/studio-api-key';

/** Header chip: which machine API key is applied across Studio. */
export function StudioApiKeyChip() {
  const [identity, setIdentity] = useState<StudioApiKeyIdentity | null>(null);

  useEffect(() => {
    const sync = () => setIdentity(loadStudioApiKeyIdentity());
    sync();
    return subscribeStudioApiKey(sync);
  }, []);

  if (!identity) {
    return (
      <Link
        href="/keys"
        className="vl-tag"
        title="Console uses your Clerk session. Apply a live or test API key for Playground Bearer calls and machine identity."
        style={{ textDecoration: 'none', maxWidth: '14rem' }}
      >
        Apply API key
      </Link>
    );
  }

  return (
    <Link
      href="/keys"
      className="vl-tag"
      title={formatStudioApiKeyLabel(identity)}
      style={{
        textDecoration: 'none',
        maxWidth: '16rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {identity.environment === 'live' ? 'Live' : 'Test'} · {identity.name} · {identity.prefix}…
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { HubConsole } from '@/components/hub-console';
import { SITE_CONTENT } from '@/data/site-content';

type Engine = {
  product: string;
  note: string;
  honesty: Record<string, boolean>;
  safety?: { note?: string } & Record<string, unknown>;
};

export function AiPublicationPlatformClient {
  const [data, setData] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect( => {
    void apiFetch<Engine>('/v1/ai-publication-platform/engine')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <HubConsole
      title="AI Publication Platform"
      lede="Publish research and language-intelligence notes with Lugemi metadata. DOI registry wiring is optional when doiRegistryOs is false — the console still ships prefill catalog and live honesty flags."
      catalogItems={[
        ...SITE_CONTENT.hubDefaults.items,
        {
          id: 'doi-optional',
          title: 'DOI optional',
          body: 'DOI field stays available for future registry OS; not required for local publication drafts.',
        },
      ]}
    >
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading engine…</p> : null}
      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{data.note}</p>
          {data.safety?.note ? (
            <p style={{ margin: 0, borderLeft: '3px solid #0f766e', paddingLeft: '0.85rem', color: 'var(--muted)' }}>
              {String(data.safety.note)}
            </p>
          ) : null}
          <pre style={{ margin: 0, padding: '1rem', background: 'var(--surface)', overflow: 'auto', fontSize: '0.8rem' }}>
            {JSON.stringify(data.honesty, null, 2)}
          </pre>
          <Link href="/research-cloud">← Research Cloud</Link>
        </div>
      ) : null}
    </HubConsole>
  );
}

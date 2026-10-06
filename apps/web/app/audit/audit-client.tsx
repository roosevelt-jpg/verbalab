'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type AuditRow = {
  id: string;
  action: string;
  route: string | null;
  ip: string | null;
  apiKeyPrefix: string | null;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null } | null;
  metadata: Record<string, unknown> | null;
};

export function AuditClient() {
  const { getToken, isLoaded } = useAuth();
  const [events, setEvents] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          setError('Sign in to view your organization audit trail.');
          setEvents([]);
          return;
        }
        const data = await apiFetch<AuditRow[]>('/v1/audit-events?limit=100', { token });
        setEvents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit log');
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken, isLoaded]);

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Audit log
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Sign-ins, API key changes, voice clone integrity events, and translate calls for your organization
        (owners and admins). Linked from Language Integrity.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0 0', display: 'grid', gap: '0.65rem' }}>
        {events.map((event) => (
          <li key={event.id} className="vl-panel" style={{ padding: '0.95rem 1.05rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 650 }}>{event.action}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {event.route ?? '—'}
                  {event.apiKeyPrefix ? ` · ${event.apiKeyPrefix}…` : ''}
                  {event.ip ? ` · ${event.ip}` : ''}
                </div>
                {event.user?.email ? (
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {event.user.name ?? event.user.email}
                  </div>
                ) : null}
              </div>
              <div className="vl-code" style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                {new Date(event.createdAt).toLocaleString()}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!error && loading ? <p style={{ color: 'var(--muted)' }}>Loading audit trail…</p> : null}
      {!error && !loading && events.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No audit events yet.</p>
      ) : null}
    </AppShell>
  );
}

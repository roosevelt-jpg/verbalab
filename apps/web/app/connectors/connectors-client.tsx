'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type SlackStatus = {
  provider: string;
  signingSecretConfigured: boolean;
  botTokenConfigured: boolean;
  disabled: boolean;
  commandsUrl: string;
  eventsUrl: string;
};

type Installation = {
  id: string;
  teamId: string;
  teamName: string | null;
  defaultTargetLang: string;
  createdAt: string;
};

export function ConnectorsClient() {
  const { getToken, isLoaded } = useAuth();
  const [status, setStatus] = useState<SlackStatus | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [target, setTarget] = useState('sw');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [st, rows] = await Promise.all([
      apiFetch<SlackStatus>('/v1/connectors/slack/status', { token }),
      apiFetch<Installation[]>('/v1/connectors/slack/installations', { token }),
    ]);
    setStatus(st);
    setInstallations(rows);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function saveInstallation() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/connectors/slack/installations', {
        method: 'POST',
        token,
        body: JSON.stringify({
          teamId,
          teamName: teamName || undefined,
          defaultTargetLang: target,
        }),
      });
      setMessage('Slack workspace linked.');
      setTeamId('');
      setTeamName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Connectors
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Slack slash command translates a message back into the channel. One connector — not a Zapier clone.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--muted)' }}>{message}</p> : null}

      {status ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem', maxWidth: '42rem' }}>
          <section className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Slack</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Signing secret: {status.signingSecretConfigured ? 'configured' : 'missing'} · Bot token:{' '}
              {status.botTokenConfigured ? 'configured' : 'optional'}
              {status.disabled ? ' · DISABLED' : ''}
            </p>
            <div style={{ fontSize: '0.9rem', display: 'grid', gap: '0.35rem' }}>
              <div>
                Slash Request URL:{' '}
                <code className="vl-code">
                  {API_URL}
                  {status.commandsUrl}
                </code>
              </div>
              <div>
                Events URL:{' '}
                <code className="vl-code">
                  {API_URL}
                  {status.eventsUrl}
                </code>
              </div>
              <div style={{ color: 'var(--muted)' }}>
                Command example: <code className="vl-code">/lugemi sw Habari dunia</code>
              </div>
            </div>
          </section>

          <section className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Link workspace</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Paste your Slack Team ID (starts with T) after installing the app.
            </p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <input
                className="vl-input"
                placeholder="Team ID (T…)"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={busy}
              />
              <input
                className="vl-input"
                placeholder="Team name (optional)"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={busy}
              />
              <input
                className="vl-input"
                placeholder="Default target lang"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                className="vl-btn vl-btn-primary"
                disabled={busy || !teamId.trim()}
                onClick={() => void saveInstallation()}
              >
                Save installation
              </button>
            </div>
          </section>

          <section className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Installations</h2>
            {installations.length === 0 ? (
              <p style={{ color: 'var(--muted)', marginBottom: 0 }}>None yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'grid', gap: '0.5rem' }}>
                {installations.map((row) => (
                  <li key={row.id} style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                    <strong style={{ color: 'var(--ink)' }}>{row.teamName ?? row.teamId}</strong> · {row.teamId} ·
                    default {row.defaultTargetLang}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : null}
    </AppShell>
  );
}

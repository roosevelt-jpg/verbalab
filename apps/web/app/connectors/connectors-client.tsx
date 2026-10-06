'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import {
  CONNECTOR_CATEGORIES,
  FIELD_LABELS,
  PLATFORM_CONNECTORS,
  countConnected,
  loadInstalls,
  saveInstalls,
  type ConnectorCategory,
  type ConnectorDef,
  type ConnectorField,
  type ConnectorInstall,
} from '@/lib/connectors-catalog';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';

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

const emptyInstall = (): ConnectorInstall => ({ connected: false });

export function ConnectorsClient() {
  const { getToken, isLoaded } = useAuth();
  const catalog = useLocaleCatalog();
  const [status, setStatus] = useState<SlackStatus | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [target, setTarget] = useState('ak');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [installs, setInstalls] = useState<Record<string, ConnectorInstall>>({});
  const [filter, setFilter] = useState<ConnectorCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('twilio');
  const [drafts, setDrafts] = useState<Record<string, ConnectorInstall>>({});

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

  useEffect(() => {
    const map = loadInstalls();
    setInstalls(map);
    setDrafts(map);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash && PLATFORM_CONNECTORS.some((c) => c.id === hash)) {
      setExpandedId(hash);
      const cat = PLATFORM_CONNECTORS.find((c) => c.id === hash)?.category;
      if (cat) setFilter(cat);
    }
  }, []);

  const visible = useMemo(
    () =>
      filter === 'all'
        ? PLATFORM_CONNECTORS
        : PLATFORM_CONNECTORS.filter((c) => c.category === filter),
    [filter],
  );

  const connectedCount = countConnected(installs);

  function updateDraft(id: string, patch: Partial<ConnectorInstall>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptyInstall()), ...patch },
    }));
  }

  function connectPlugin(def: ConnectorDef) {
    const draft = drafts[def.id] ?? emptyInstall();
    const next: ConnectorInstall = {
      ...draft,
      connected: true,
      connectedAt: Date.now(),
    };
    const map = { ...installs, [def.id]: next };
    setInstalls(map);
    setDrafts((prev) => ({ ...prev, [def.id]: next }));
    saveInstalls(map);
    setMessage(
      `${def.name} marked connected. ${def.envHint.includes('configure') || def.envHint.includes('optional') || def.envHint.includes('later') ? 'Live credentials can stay in deploy env until you are ready.' : 'Store secrets in env for production.'}`,
    );
    setError(null);
  }

  function disconnectPlugin(def: ConnectorDef) {
    const next: ConnectorInstall = {
      ...(drafts[def.id] ?? emptyInstall()),
      connected: false,
      connectedAt: undefined,
    };
    const map = { ...installs, [def.id]: next };
    setInstalls(map);
    setDrafts((prev) => ({ ...prev, [def.id]: next }));
    saveInstalls(map);
    setMessage(`${def.name} disconnected.`);
  }

  async function saveSlackInstallation() {
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
      const map = {
        ...installs,
        slack: { connected: true, connectedAt: Date.now() },
      };
      setInstalls(map);
      saveInstalls(map);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <header className="lg-connectors-hero">
        <div>
          <p className="lg-workspace-kicker">Single-integration plugin installer</p>
          <h1 className="lg-workspace-title">Connectors</h1>
          <p className="lg-workspace-lead">
            Connect Lugemi Language Intelligence to voice platforms (Twilio, VAPI, Google Voice), video
            generation (Higgsfield, Google Video, Runway), and office stacks with one API key or webhook
            per connector — then demo dialect translate for trade, negotiate, and educate.
          </p>
          <p className="lg-workspace-sync">
            Voice/video sync clarity: Lugemi owns speech and dialect audio. Downstream platforms render
            or route media — they do not inject a second voice layer.
          </p>
        </div>
        <aside className="lg-connectors-hero__stats" aria-label="Installer summary">
          <strong>{connectedCount}</strong>
          <span>plugins connected</span>
          <Link href="/docs">API docs →</Link>
          <Link href="/playground?source=en&target=ak">Playground en→Twi →</Link>
          <Link href="/chat">Chat Studio demo →</Link>
        </aside>
      </header>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--muted)' }}>{message}</p> : null}

      <div className="lg-connectors-filters" role="tablist" aria-label="Connector categories">
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          className={`vl-mode-tab${filter === 'all' ? ' is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {CONNECTOR_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={filter === cat.id}
            className={`vl-mode-tab${filter === cat.id ? ' is-active' : ''}`}
            onClick={() => setFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filter !== 'all' ? (
        <p className="lg-connectors-cat-lead">
          {CONNECTOR_CATEGORIES.find((c) => c.id === filter)?.lead}
        </p>
      ) : (
        <p className="lg-connectors-cat-lead">
          Africa-first demos default to English → Twi (ak). Soft-connect stores install state in this
          browser; production secrets belong in deploy env when live credentials are ready.
        </p>
      )}

      <ul className="lg-connectors-install-list">
        {visible.map((def) => {
          const on = Boolean(installs[def.id]?.connected);
          const draft = drafts[def.id] ?? emptyInstall();
          const open = expandedId === def.id;
          return (
            <li key={def.id} id={def.id} className={`lg-connectors-install${on ? ' is-on' : ''}`}>
              <button
                type="button"
                className="lg-connectors-install__head"
                aria-expanded={open}
                onClick={() => setExpandedId(open ? null : def.id)}
              >
                <span>
                  <strong>{def.name}</strong>
                  <em>{def.category}</em>
                </span>
                <span className="lg-connectors-install__status">{on ? 'Connected' : 'Available'}</span>
              </button>
              {open ? (
                <div className="lg-connectors-install__body">
                  <p>{def.blurb}</p>
                  <p className="lg-connectors-docs">{def.docs}</p>
                  <p className="lg-connectors-env">
                    <span>Env</span> {def.envHint}
                  </p>

                  {def.fields.length > 0 ? (
                    <div className="lg-connectors-fields">
                      {def.fields.map((field: ConnectorField) => (
                        <label key={field}>
                          <span>{FIELD_LABELS[field]}</span>
                          <input
                            className="vl-input"
                            type={field === 'apiKey' ? 'password' : 'text'}
                            autoComplete="off"
                            placeholder={
                              field === 'webhookUrl'
                                ? `${API_URL}/v1/...`
                                : `Paste ${FIELD_LABELS[field].toLowerCase()}`
                            }
                            value={String(draft[field] ?? '')}
                            onChange={(e) => updateDraft(def.id, { [field]: e.target.value })}
                          />
                        </label>
                      ))}
                    </div>
                  ) : null}

                  {def.liveStatus === 'slack' && status ? (
                    <div className="lg-connectors-slack">
                      <p>
                        Signing secret: {status.signingSecretConfigured ? 'configured' : 'missing'} · Bot
                        token: {status.botTokenConfigured ? 'configured' : 'optional'}
                        {status.disabled ? ' · DISABLED' : ''}
                      </p>
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
                      <div className="lg-connectors-fields" style={{ marginTop: '0.75rem' }}>
                        <label>
                          <span>Team ID</span>
                          <input
                            className="vl-input"
                            placeholder="T…"
                            value={teamId}
                            onChange={(e) => setTeamId(e.target.value)}
                            disabled={busy}
                          />
                        </label>
                        <label>
                          <span>Team name</span>
                          <input
                            className="vl-input"
                            placeholder="Optional"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            disabled={busy}
                          />
                        </label>
                        <label>
                          <span>Default target dialect</span>
                          <LocaleSelect
                            className="vl-input"
                            value={target}
                            onChange={setTarget}
                            languages={catalog.languages}
                            locales={catalog.locales}
                            dialects={catalog.dialects}
                            accents={catalog.accents}
                            disabled={busy}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="vl-btn vl-btn-primary"
                        disabled={busy || !teamId.trim()}
                        onClick={() => void saveSlackInstallation()}
                      >
                        Save Slack installation
                      </button>
                      {installations.length > 0 ? (
                        <ul className="lg-connectors-slack-installs">
                          {installations.map((row) => (
                            <li key={row.id}>
                              <strong>{row.teamName ?? row.teamId}</strong> · {row.teamId} · default{' '}
                              {row.defaultTargetLang}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="lg-connectors-actions">
                    {on ? (
                      <button
                        type="button"
                        className="vl-btn vl-btn-secondary"
                        onClick={() => disconnectPlugin(def)}
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="vl-btn vl-btn-primary"
                        onClick={() => connectPlugin(def)}
                      >
                        Connect / Install
                      </button>
                    )}
                    <Link href={def.demoHref} className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                      {def.demoLabel}
                    </Link>
                    <Link href="/docs" className="lg-connectors-doclink">
                      Full API docs
                    </Link>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <section className="lg-connectors-africa" aria-labelledby="connectors-africa">
        <h2 id="connectors-africa" className="lg-workspace-section-label">
          Live dialect paths
        </h2>
        <ul>
          <li>
            <Link href="/translate?source=en&target=ak">Trade — Translate en→Twi</Link>
          </li>
          <li>
            <Link href="/chat">Negotiate — Chat Studio live record</Link>
          </li>
          <li>
            <Link href="/playground?source=en&target=yo">Educate — Playground en→Yorùbá</Link>
          </li>
          <li>
            <Link href="/dashboard">Back to Workspace Console</Link>
          </li>
        </ul>
      </section>
    </AppShell>
  );
}

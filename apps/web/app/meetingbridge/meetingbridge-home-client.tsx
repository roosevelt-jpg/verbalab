'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';
import { PageHeader, StatCard, FeaturePanel } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';

type Catalog = {
  name?: string;
  headline?: string;
  description?: string;
  corridors?: { id: string; label: string; note: string; translation: boolean; asr: boolean; tts: boolean }[];
  media?: { mode: string; provisioned: boolean; note: string };
  limitations?: string[];
};

type MeetingRow = {
  id: string;
  title: string;
  state: string;
  corridor: string;
  role: string;
  createdAt: string;
};

export function MeetingBridgeHomeClient() {
  const { getToken, isSignedIn } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('Supplier coordination');
  const [agenda, setAgenda] = useState('Confirm dispatch quantities, owners, and deadlines.');
  const [corridor, setCorridor] = useState('en-ak');

  const load = useCallback(async () => {
    setError(null);
    try {
      const token =
        isClerkConfigured() && isSignedIn ? await getToken() : null;
      const cat = await apiFetch<Catalog>('/v1/meetingbridge/catalog', { token: token ?? undefined });
      setCatalog(cat);
      if (token) {
        const list = await apiFetch<{ meetings: MeetingRow[] }>('/v1/meetingbridge/meetings', { token });
        setMeetings(list.meetings ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load MeetingBridge');
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!(isClerkConfigured() && isSignedIn)) {
      setError('Sign in to create a meeting.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      const created = await apiFetch<{ meeting: { id: string } }>('/v1/meetingbridge/meetings', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          title,
          agenda,
          corridor,
          speakingLanguage: corridor.startsWith('en') ? 'en' : corridor.split('-')[0],
          listeningLanguage: corridor.split('-')[1] ?? 'ak',
          timeZone: 'Africa/Accra',
        }),
      });
      window.location.href = `/meetingbridge/meetings/${created.meeting.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create meeting');
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="MeetingBridge"
          title="Speak your language. Confirm the same plan."
          lede={
            catalog?.description ??
            'Multilingual meetings with revision-linked transcripts, reviewed decisions, and explicit confirmations.'
          }
        >
          <div className="lg-page-header__actions">
            <Link href="/docs" className="vl-btn vl-btn-secondary">
              Docs
            </Link>
            <Link href="/dealbridge" className="vl-btn vl-btn-secondary">
              DealBridge handoff
            </Link>
          </div>
        </PageHeader>

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        <div className="lg-grid-stats">
          <StatCard
            label="Media"
            value={
              catalog?.media?.mode === 'webrtc_sfu'
                ? 'SFU WebRTC'
                : catalog?.media?.mode === 'webrtc_mesh'
                  ? 'Mesh WebRTC'
                  : 'Turn-taking'
            }
            hint={catalog?.media?.note ?? 'Mesh WebRTC signaling works without an SFU URL'}
          />
          <StatCard label="Corridor" value={corridor.toUpperCase()} hint="Gated per ASR / translate / TTS" />
          <StatCard label="Consent" value="Explicit" hint="Silence is never agreement" />
          <StatCard label="Meetings" value={String(meetings.length)} hint="Your active memberships" />
        </div>

        <section className="lg-page-section" aria-labelledby="mb-create">
          <div className="lg-page-section__head">
            <h2 id="mb-create" className="lg-type-section">
              Create a meeting
            </h2>
            <p className="lg-type-compact">
              Participants choose speaking and listening languages. Confirmations require every named owner plus the
              organizer — AI drafts never approve.
            </p>
          </div>
          <form className="lg-card" onSubmit={onCreate} style={{ display: 'grid', gap: '0.85rem' }}>
            <label className="vl-field-label">
              Title
              <input className="vl-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label className="vl-field-label">
              Agenda
              <textarea className="vl-field" rows={3} value={agenda} onChange={(e) => setAgenda(e.target.value)} />
            </label>
            <label className="vl-field-label">
              Corridor
              <select className="vl-field" value={corridor} onChange={(e) => setCorridor(e.target.value)}>
                {(catalog?.corridors ?? [{ id: 'en-ak', label: 'English ↔ Akan/Twi (Ghana)' }]).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create meeting'}
            </button>
          </form>
        </section>

        <section className="lg-page-section" aria-labelledby="mb-list">
          <div className="lg-page-section__head">
            <h2 id="mb-list" className="lg-type-section">
              Your meetings
            </h2>
          </div>
          {meetings.length === 0 ? (
            <p className="lg-type-compact">No meetings yet. Create one to open the lobby and invite participants.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.65rem' }}>
              {meetings.map((m) => (
                <li key={m.id}>
                  <Link href={`/meetingbridge/meetings/${m.id}`} className="lg-card" style={{ display: 'block', textDecoration: 'none' }}>
                    <strong>{m.title}</strong>
                    <div className="lg-type-compact">
                      {m.state} · {m.corridor} · {m.role}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg-page-section" aria-labelledby="mb-honest">
          <div className="lg-page-section__head">
            <h2 id="mb-honest" className="lg-type-section">
              Honest capabilities
            </h2>
          </div>
          <div className="lg-grid-2">
            {(catalog?.corridors ?? []).map((c) => (
              <FeaturePanel key={c.id} title={c.label} body={c.note} />
            ))}
          </div>
          {catalog?.limitations?.length ? (
            <ul className="lg-type-compact" style={{ marginTop: '1rem' }}>
              {catalog.limitations.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}

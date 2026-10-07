'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Dialect = { code: string; languageCode: string; name: string; country: string };

type Overview = {
  storage: 'object_storage' | 'database';
  dialects: Array<{
    code: string;
    name: string;
    speakers: number;
    prompts: number;
    pending: number;
    approved: number;
    rejected: number;
    approvedMs: number;
  }>;
};

type Speaker = {
  id: string;
  token: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  ageRange: string | null;
  hometown: string | null;
  consentAt: string | null;
  consentName: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  recordings: { pending: number; approved: number; rejected: number };
  recordedMs: number;
};

type Prompt = {
  id: string;
  text: string;
  category: string;
  active: boolean;
  recordings: number;
  feedback: number;
};

type Recording = {
  id: string;
  text: string;
  status: string;
  durationMs: number;
  createdAt: string;
  speaker: { name: string; dialect: string };
};

type Feedback = {
  id: string;
  suggestion: string;
  createdAt: string;
  prompt: { text: string };
  speaker: { name: string };
};

type Tab = 'speakers' | 'sentences' | 'review' | 'feedback';

const emptySpeaker = { name: '', email: '', phone: '', gender: '', ageRange: '', hometown: '', notes: '' };

function hours(ms: number): string {
  return ms >= 3_600_000 ? `${(ms / 3_600_000).toFixed(2)} h` : `${(ms / 60_000).toFixed(1)} min`;
}

export function VoiceDataClient() {
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('speakers');
  const [dialects, setDialects] = useState<Dialect[]>([]);
  const [dialect, setDialect] = useState('ak-gh-asante');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [speakerForm, setSpeakerForm] = useState(emptySpeaker);
  const [promptText, setPromptText] = useState('');
  const [promptCategory, setPromptCategory] = useState('everyday');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const token = useCallback(async () => {
    const t = await getToken();
    if (!t) throw new Error('Not signed in');
    return t;
  }, [getToken]);

  const call = useCallback(
    async <T,>(path: string, init: { method?: string; body?: string } = {}) =>
      apiFetch<T>(path, { ...init, token: await token(), workspaceId: null, organizationId: null }),
    [token],
  );

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      const t = await getToken();
      if (!t) {
        router.replace('/sign-in?redirect_url=%2Fadmin%2Fvoice-data');
        return;
      }
      try {
        const s = await apiFetch<{ admin: boolean }>('/v1/admin/status', { token: t });
        setIsAdmin(s.admin);
        if (s.admin) setDialects(await apiFetch<Dialect[]>('/v1/admin/voice-data/dialects', { token: t }));
      } catch (err) {
        setIsAdmin(false);
        setError(err instanceof Error ? err.message : 'Unable to verify admin access');
      }
    })();
  }, [isLoaded, getToken, router]);

  const refresh = useCallback(async () => {
    const q = `dialect=${encodeURIComponent(dialect)}`;
    try {
      setOverview(await call<Overview>('/v1/admin/voice-data/overview'));
      if (tab === 'speakers') setSpeakers(await call<Speaker[]>(`/v1/admin/voice-data/speakers?${q}`));
      if (tab === 'sentences') setPrompts(await call<Prompt[]>(`/v1/admin/voice-data/prompts?${q}`));
      if (tab === 'review') {
        setRecordings(
          await call<Recording[]>(`/v1/admin/voice-data/recordings?${q}&status=${encodeURIComponent(reviewStatus)}`),
        );
      }
      if (tab === 'feedback') setFeedback(await call<Feedback[]>(`/v1/admin/voice-data/feedback?${q}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    }
  }, [call, dialect, tab, reviewStatus]);

  useEffect(() => {
    if (isAdmin) void refresh();
  }, [isAdmin, refresh]);

  useEffect(() => () => audioRef.current?.pause(), []);

  async function run(action: () => Promise<void>, done?: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      if (done) setMessage(done);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  function recorderLink(s: Speaker): string {
    return `${window.location.origin}/record/${s.token}`;
  }

  async function play(id: string) {
    audioRef.current?.pause();
    if (playingId === id) {
      setPlayingId(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/v1/admin/voice-data/recordings/${id}/audio`, {
        headers: { Authorization: `Bearer ${await token()}` },
      });
      if (!res.ok) throw new Error(`Audio HTTP ${res.status}`);
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setPlayingId(null);
      };
      setPlayingId(id);
      await audio.play();
    } catch (err) {
      setPlayingId(null);
      setError(err instanceof Error ? err.message : 'Playback failed');
    }
  }

  async function exportManifest() {
    const res = await fetch(`${API_URL}/v1/admin/voice-data/export?dialect=${encodeURIComponent(dialect)}`, {
      headers: { Authorization: `Bearer ${await token()}` },
    });
    if (!res.ok) throw new Error(`Export HTTP ${res.status}`);
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `lugemi-voice-data-${dialect}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stats = overview?.dialects.find((d) => d.code === dialect);
  const dialectName = dialects.find((d) => d.code === dialect)?.name ?? dialect;

  return (
    <AppShell>
      <div className="lg-admin-console">
        <header className="lg-admin-hero">
          <div>
            <p className="lg-admin-kicker">Native voices</p>
            <h1>Voice data</h1>
            <p>
              Invite native speakers, collect consented recordings dialect by dialect, and review them before they train
              Lugemi voices.
            </p>
          </div>
          <div className="lg-admin-hero-links">
            <Link href="/admin" className="vl-btn">CMS</Link>
            <Link href="/admin/workspaces" className="vl-btn">Workspaces</Link>
          </div>
        </header>

        {error ? <p className="lg-admin-banner lg-admin-banner--bad">{error}</p> : null}
        {message ? <p className="lg-admin-banner lg-admin-banner--ok">{message}</p> : null}
        {isAdmin === null ? <p style={{ color: 'var(--muted)' }}>Checking access…</p> : null}
        {isAdmin === false ? (
          <section className="vl-panel lg-admin-empty">
            <h2>Platform admin required</h2>
            <p>Sign in with a platform admin account to manage voice data.</p>
          </section>
        ) : null}

        {isAdmin ? (
          <>
            <div className="lg-admin-filters" style={{ alignItems: 'center' }}>
              <select className="vl-input" value={dialect} onChange={(e) => setDialect(e.target.value)} aria-label="Dialect">
                {dialects.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              <span style={{ color: 'var(--muted)' }}>
                {stats
                  ? `${stats.speakers} speakers · ${stats.prompts} sentences · ${stats.approved} approved (${hours(stats.approvedMs)}) · ${stats.pending} to review`
                  : 'No data yet for this dialect'}
              </span>
              <button type="button" className="vl-btn" disabled={busy} onClick={() => void run(exportManifest, 'Manifest downloaded')}>
                Export approved (JSONL)
              </button>
            </div>
            {overview?.storage === 'database' ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Audio is stored in the database (pilot mode). Connect object storage before collecting many hours.
              </p>
            ) : null}

            <nav className="lg-admin-tabs" aria-label="Voice data sections">
              {(
                [
                  ['speakers', 'Speakers'],
                  ['sentences', 'Sentences'],
                  ['review', 'Review recordings'],
                  ['feedback', 'Native corrections'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={tab === id ? 'lg-admin-tab lg-admin-tab--active' : 'lg-admin-tab'}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </nav>

            {tab === 'speakers' ? (
              <div className="lg-admin-columns">
                <section className="vl-panel" style={{ padding: '1rem' }}>
                  <h3>Invite a {dialectName} speaker</h3>
                  <div className="lg-admin-create-form">
                    <label>Name<input className="vl-input" value={speakerForm.name} onChange={(e) => setSpeakerForm({ ...speakerForm, name: e.target.value })} /></label>
                    <label>Phone / WhatsApp<input className="vl-input" value={speakerForm.phone} onChange={(e) => setSpeakerForm({ ...speakerForm, phone: e.target.value })} /></label>
                    <label>Email<input className="vl-input" value={speakerForm.email} onChange={(e) => setSpeakerForm({ ...speakerForm, email: e.target.value })} /></label>
                    <label>Gender
                      <select className="vl-input" value={speakerForm.gender} onChange={(e) => setSpeakerForm({ ...speakerForm, gender: e.target.value })}>
                        <option value="">—</option><option value="female">Female</option><option value="male">Male</option>
                      </select>
                    </label>
                    <label>Age range
                      <select className="vl-input" value={speakerForm.ageRange} onChange={(e) => setSpeakerForm({ ...speakerForm, ageRange: e.target.value })}>
                        <option value="">—</option>
                        {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </label>
                    <label>Hometown / where they grew up<input className="vl-input" value={speakerForm.hometown} onChange={(e) => setSpeakerForm({ ...speakerForm, hometown: e.target.value })} placeholder="e.g. Kumasi" /></label>
                    <label>Notes (payment, referral…)<input className="vl-input" value={speakerForm.notes} onChange={(e) => setSpeakerForm({ ...speakerForm, notes: e.target.value })} /></label>
                    <button
                      type="button"
                      className="vl-btn vl-btn-primary"
                      disabled={busy || !speakerForm.name.trim()}
                      onClick={() =>
                        void run(async () => {
                          const created = await call<Speaker>('/v1/admin/voice-data/speakers', {
                            method: 'POST',
                            body: JSON.stringify({ ...speakerForm, dialect }),
                          });
                          setSpeakerForm(emptySpeaker);
                          await navigator.clipboard?.writeText(recorderLink(created)).catch(() => undefined);
                        }, 'Speaker invited — their recording link was copied to your clipboard')
                      }
                    >
                      Create recording link
                    </button>
                  </div>
                </section>
                <section className="vl-panel" style={{ padding: '1rem' }}>
                  <h3>{dialectName} speakers</h3>
                  {speakers.length === 0 ? <p style={{ color: 'var(--muted)' }}>No speakers yet.</p> : null}
                  <ul className="lg-admin-activity">
                    {speakers.map((s) => (
                      <li key={s.id} style={{ display: 'block' }}>
                        <strong>{s.name}</strong>{' '}
                        <span>
                          {[s.gender, s.ageRange, s.hometown].filter(Boolean).join(' · ') || '—'} ·{' '}
                          {s.withdrawnAt ? 'withdrawn' : s.consentAt ? `consented as “${s.consentName}”` : 'not yet consented'} ·{' '}
                          {hours(s.recordedMs)} · {s.recordings.approved} approved / {s.recordings.pending} pending
                        </span>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button
                            type="button"
                            className="vl-btn"
                            onClick={() =>
                              void navigator.clipboard
                                .writeText(recorderLink(s))
                                .then(() => setMessage(`Recording link for ${s.name} copied`))
                            }
                          >
                            Copy recording link
                          </button>
                          <button
                            type="button"
                            className="vl-btn"
                            onClick={() => {
                              setTab('review');
                              setReviewStatus('pending');
                            }}
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            className="vl-btn"
                            disabled={busy}
                            style={{ color: 'var(--bad)' }}
                            onClick={() => {
                              if (!window.confirm(`Delete ${s.name} and ALL their recordings permanently?`)) return;
                              void run(async () => {
                                await call(`/v1/admin/voice-data/speakers/${s.id}`, { method: 'DELETE' });
                              }, `${s.name} and their recordings were deleted`);
                            }}
                          >
                            Delete speaker + data
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            ) : null}

            {tab === 'sentences' ? (
              <div className="lg-admin-columns">
                <section className="vl-panel" style={{ padding: '1rem' }}>
                  <h3>Add {dialectName} sentences</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                    One sentence per line, written by native speakers the way people really talk — greetings, questions,
                    numbers, prices, directions, everyday chat, and natural code-switching. Avoid translated-sounding text.
                  </p>
                  <select className="vl-input" value={promptCategory} onChange={(e) => setPromptCategory(e.target.value)} aria-label="Category">
                    {['everyday', 'greetings', 'questions', 'numbers', 'commerce', 'directions', 'health', 'code-switch', 'names', 'reading'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <textarea
                    className="vl-input"
                    lang={dialect}
                    rows={12}
                    style={{ display: 'block', width: '100%', marginTop: 8 }}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                  />
                  <button
                    type="button"
                    className="vl-btn vl-btn-primary"
                    style={{ marginTop: 8 }}
                    disabled={busy || !promptText.trim()}
                    onClick={() =>
                      void run(async () => {
                        const res = await call<{ added: number; skipped: number }>('/v1/admin/voice-data/prompts', {
                          method: 'POST',
                          body: JSON.stringify({ dialect, category: promptCategory, lines: promptText.split('\n') }),
                        });
                        setPromptText('');
                        setMessage(`Added ${res.added} sentences${res.skipped ? ` (${res.skipped} duplicates skipped)` : ''}`);
                      })
                    }
                  >
                    Add sentences
                  </button>
                </section>
                <section className="vl-panel" style={{ padding: '1rem' }}>
                  <h3>{prompts.length} sentences</h3>
                  <ul className="lg-admin-activity">
                    {prompts.map((p) => (
                      <li key={p.id} style={{ display: 'block', opacity: p.active ? 1 : 0.5 }}>
                        <strong lang={dialect}>{p.text}</strong>
                        <span>
                          {' '}
                          {p.category} · {p.recordings} recordings{p.feedback ? ` · ${p.feedback} corrections` : ''}
                        </span>{' '}
                        <button
                          type="button"
                          className="vl-btn"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await call(`/v1/admin/voice-data/prompts/${p.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ active: !p.active }),
                              });
                            })
                          }
                        >
                          {p.active ? 'Retire' : 'Restore'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            ) : null}

            {tab === 'review' ? (
              <section className="vl-panel" style={{ padding: '1rem' }}>
                <div className="lg-admin-filters">
                  <select className="vl-input" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} aria-label="Status">
                    <option value="pending">To review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <span style={{ color: 'var(--muted)' }}>
                    Approve only clips that sound natural, clear and noise-free — they become training data.
                  </span>
                </div>
                {recordings.length === 0 ? <p style={{ color: 'var(--muted)' }}>Nothing here.</p> : null}
                <ul className="lg-admin-activity">
                  {recordings.map((r) => (
                    <li key={r.id} style={{ display: 'block' }}>
                      <strong lang={dialect}>{r.text}</strong>
                      <span>
                        {' '}
                        {r.speaker.name} · {(r.durationMs / 1000).toFixed(1)}s · {new Date(r.createdAt).toLocaleString()}
                      </span>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button type="button" className="vl-btn" onClick={() => void play(r.id)}>
                          {playingId === r.id ? 'Stop' : 'Play'}
                        </button>
                        {r.status !== 'approved' ? (
                          <button
                            type="button"
                            className="vl-btn vl-btn-primary"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                await call(`/v1/admin/voice-data/recordings/${r.id}`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ status: 'approved' }),
                                });
                              })
                            }
                          >
                            Approve
                          </button>
                        ) : null}
                        {r.status !== 'rejected' ? (
                          <button
                            type="button"
                            className="vl-btn"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                await call(`/v1/admin/voice-data/recordings/${r.id}`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ status: 'rejected' }),
                                });
                              })
                            }
                          >
                            Reject
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {tab === 'feedback' ? (
              <section className="vl-panel" style={{ padding: '1rem' }}>
                <p style={{ color: 'var(--muted)' }}>
                  Sentences native speakers said they would not say that way, with how they would say it. Retire or rewrite
                  those sentences.
                </p>
                {feedback.length === 0 ? <p style={{ color: 'var(--muted)' }}>No corrections yet.</p> : null}
                <ul className="lg-admin-activity">
                  {feedback.map((f) => (
                    <li key={f.id} style={{ display: 'block' }}>
                      <span lang={dialect} style={{ textDecoration: 'line-through' }}>{f.prompt.text}</span>
                      <br />
                      <strong lang={dialect}>{f.suggestion}</strong>
                      <span> — {f.speaker.name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

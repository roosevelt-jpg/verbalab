'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { EverydayAuthGate, type EverydayAuthBag } from '@/lib/everyday-auth';

type SessionView = {
  session: {
    id: string;
    mode: string;
    corridor: string;
    state: string;
    preferredVariety: string;
    sourceLanguage: string;
  };
  documents: Array<{
    id: string;
    originalName: string;
    status: string;
    qualityReport?: { requireRecapture?: boolean; findings?: { message: string }[] };
    sourceRevisions: Array<{
      id: string;
      fullText: string;
      blocks: Array<{ id: string; text: string; uncertainty: string }>;
      translations: Array<{ id: string; faithfulText: string; targetVariety: string; stale: boolean }>;
      explanations: Array<{
        id: string;
        simplifiedText: string;
        adviceDisclaimer: string;
        claims: Array<{ id: string; text: string; evidenceBlockIds: string[] }>;
      }>;
      questions: Array<{
        id: string;
        question: string;
        answerability: string;
        answerText: string;
        reason?: string;
      }>;
    }>;
  }>;
  replies: Array<{
    id: string;
    userSourceText: string;
    targetText: string;
    userSourceHash: string;
    targetHash: string;
    criticalFindings: Array<{ code: string; message: string }>;
    approvals: Array<{ id: string; action: string }>;
  }>;
  terms: Array<{ id: string; selectedSpan: string; definition: string; scope: string }>;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function EverydaySessionClient({ sessionId }: { sessionId: string }) {
  return (
    <EverydayAuthGate>
      {(auth) => <EverydaySessionFlow sessionId={sessionId} auth={auth} />}
    </EverydayAuthGate>
  );
}

function EverydaySessionFlow({
  sessionId,
  auth,
}: {
  sessionId: string;
  auth: EverydayAuthBag;
}) {
  const [view, setView] = useState<SessionView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'faithful' | 'explain'>('faithful');
  const [question, setQuestion] = useState('By when?');
  const [replyText, setReplyText] = useState('I will attend on the date shown. Thank you.');
  const [termSpan, setTermSpan] = useState('Amount due');
  const [playbackRate, setPlaybackRate] = useState(1);

  const load = useCallback(async () => {
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<SessionView>(`/v1/everyday/sessions/${sessionId}`, {
        token: a.token,
        headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
      });
      setView(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load session');
    }
  }, [auth, sessionId]);

  useEffect(() => {
    if (auth.ready) void load();
  }, [load, auth.ready]);

  const source = view?.documents?.[0]?.sourceRevisions?.[0];
  const translation = source?.translations?.[0];
  const explanation = source?.explanations?.[0];
  const document = view?.documents?.[0];

  const uncertain = useMemo(
    () => source?.blocks?.filter((b) => b.uncertainty !== 'low') ?? [],
    [source],
  );

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError('Choose a photo, PDF, or text file');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const contentBase64 = await fileToBase64(file);
      await apiFetch(`/v1/everyday/sessions/${sessionId}/uploads`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
        body: {
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          contentBase64,
        },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function runTranslate() {
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/everyday/sources/${source.id}/translations`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
        body: {},
      });
      setTab('faithful');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translate failed');
    } finally {
      setBusy(false);
    }
  }

  async function runExplain() {
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/everyday/sources/${source.id}/explanations`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
        body: translation ? { translationRevisionId: translation.id } : {},
      });
      setTab('explain');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Explain failed');
    } finally {
      setBusy(false);
    }
  }

  async function runQuestion(e: FormEvent) {
    e.preventDefault();
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/everyday/sources/${source.id}/questions`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
        body: { question },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Question failed');
    } finally {
      setBusy(false);
    }
  }

  async function playAudio(kind: 'translation' | 'explanation', id: string) {
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const created = await apiFetch<{ audio: { id: string; hasBytes?: boolean; note?: string } }>(
        '/v1/everyday/audio',
        {
          method: 'POST',
          token: a.token,
          headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
          body:
            kind === 'translation'
              ? { kind, translationRevisionId: id }
              : { kind, explanationRevisionId: id },
        },
      );
      if (!created.audio.hasBytes) {
        setError(created.audio.note ?? 'Audio unavailable for this language');
        return;
      }
      const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
      const res = await fetch(`${base}/v1/everyday/artifacts/${created.audio.id}/audio`, {
        headers: {
          Authorization: `Bearer ${a.token}`,
          ...(a.actor ? { 'X-Everyday-Actor-Id': a.actor } : {}),
        },
      });
      if (!res.ok) throw new Error('Audio download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.playbackRate = playbackRate;
      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playback failed');
    } finally {
      setBusy(false);
    }
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/everyday/sessions/${sessionId}/replies`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
        body: { userSourceText: replyText, sourceRevisionId: source?.id },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reply failed');
    } finally {
      setBusy(false);
    }
  }

  async function approve(replyId: string, sourceHash: string, targetHash: string) {
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<{ export: { sourceText: string; targetText: string } }>(
        `/v1/everyday/replies/${replyId}/approvals`,
        {
          method: 'POST',
          token: a.token,
          headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
          body: {
            action: 'approve_copy',
            sourcePresentationHash: sourceHash,
            targetPresentationHash: targetHash,
          },
        },
      );
      await navigator.clipboard.writeText(
        `${res.export.sourceText}\n\n---\n\n${res.export.targetText}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setBusy(false);
    }
  }

  async function onTerm(e: FormEvent) {
    e.preventDefault();
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/everyday/sessions/${sessionId}/terms`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
        body: { selectedSpan: termSpan, sourceRevisionId: source.id, scope: 'document' },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Term explain failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm('Delete this session and all derivatives?')) return;
    setBusy(true);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/everyday/sessions/${sessionId}`, {
        method: 'DELETE',
        token: a.token,
        headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
      });
      window.location.href = '/everyday';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Everyday"
          title={view ? view.session.mode.replaceAll('_', ' ') : 'Session'}
          lede={
            view
              ? `${view.session.corridor} · ${view.session.state}. Private processing — not end-to-end encryption.`
              : 'Loading…'
          }
        >
          <div className="lg-page-header__actions">
            <Link href="/everyday" className="vl-btn vl-btn-secondary">
              Home
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void onDelete()}>
              Delete
            </button>
          </div>
        </PageHeader>

        {!auth.signedIn ? (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
            <input
              className="vl-field"
              value={auth.apiKey}
              onChange={(e) => auth.setApiKey(e.target.value)}
              placeholder="lg_…"
            />
            <input
              className="vl-field"
              value={auth.actorId}
              onChange={(e) => auth.setActorId(e.target.value)}
              placeholder="Actor id"
            />
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Load
            </button>
          </section>
        ) : null}

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        <section className="lg-page-section" aria-labelledby="ed-upload">
          <div className="lg-page-section__head">
            <h2 id="ed-upload" className="lg-type-section">
              Capture or upload
            </h2>
            <p className="lg-type-compact">
              Documents stay private to your organization. Training consent is off unless opted in.
            </p>
          </div>
          <form onSubmit={onUpload} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
            <input
              name="file"
              type="file"
              accept="image/*,.pdf,.txt"
              capture="environment"
              className="vl-field"
            />
            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
              {busy ? 'Working…' : 'Upload'}
            </button>
          </form>
          {document?.status === 'recapture_required' ? (
            <ul className="lg-type-compact" style={{ color: '#92400e', paddingLeft: '1.2rem' }}>
              {(document.qualityReport?.findings ?? []).map((f) => (
                <li key={f.message}>{f.message}</li>
              ))}
            </ul>
          ) : null}
        </section>

        {source ? (
          <>
            <section className="lg-page-section">
              <h2 className="lg-type-section">Source and OCR review</h2>
              <pre className="lg-card lg-type-compact" style={{ whiteSpace: 'pre-wrap', maxHeight: 280, overflow: 'auto' }}>
                {source.fullText}
              </pre>
              {uncertain.length ? (
                <p className="lg-type-compact">
                  Uncertain OCR blocks: {uncertain.map((b) => b.id).join(', ')}. Correct before trusting
                  deadlines or amounts.
                </p>
              ) : null}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="vl-btn vl-btn-primary"
                  disabled={busy}
                  onClick={() => void runTranslate()}
                >
                  Translate (faithful)
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy}
                  onClick={() => void runExplain()}
                >
                  Explain (plain language)
                </button>
              </div>
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Translation and explanation</h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }} role="tablist">
                <button
                  type="button"
                  className={`vl-btn ${tab === 'faithful' ? 'vl-btn-primary' : 'vl-btn-secondary'}`}
                  onClick={() => setTab('faithful')}
                  aria-label="Faithful translation"
                >
                  Faithful translation
                </button>
                <button
                  type="button"
                  className={`vl-btn ${tab === 'explain' ? 'vl-btn-primary' : 'vl-btn-secondary'}`}
                  onClick={() => setTab('explain')}
                  aria-label="Simple explanation"
                >
                  Simple explanation
                </button>
              </div>
              <label className="vl-field-label">
                Playback speed ({playbackRate}x)
                <input
                  type="range"
                  min={0.75}
                  max={1.5}
                  step={0.25}
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                />
              </label>
              {tab === 'faithful' ? (
                <div>
                  <pre className="lg-card lg-type-compact" style={{ whiteSpace: 'pre-wrap' }}>
                    {translation?.faithfulText ?? 'Run Translate for the faithful rendering.'}
                  </pre>
                  {translation ? (
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary"
                      style={{ marginTop: '0.5rem' }}
                      disabled={busy}
                      onClick={() => void playAudio('translation', translation.id)}
                    >
                      Read translation aloud
                    </button>
                  ) : null}
                </div>
              ) : (
                <div>
                  <pre className="lg-card lg-type-compact" style={{ whiteSpace: 'pre-wrap' }}>
                    {explanation?.simplifiedText ??
                      'Run Explain for a separately labeled plain-language summary.'}
                  </pre>
                  {explanation ? (
                    <>
                      <p className="lg-type-compact" style={{ opacity: 0.75 }}>
                        {explanation.adviceDisclaimer}
                      </p>
                      <button
                        type="button"
                        className="vl-btn vl-btn-secondary"
                        disabled={busy}
                        onClick={() => void playAudio('explanation', explanation.id)}
                      >
                        Read explanation aloud
                      </button>
                    </>
                  ) : null}
                </div>
              )}
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Grounded questions</h2>
              <form onSubmit={runQuestion} className="lg-card" style={{ display: 'grid', gap: '0.5rem' }}>
                <input
                  className="vl-field"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  aria-label="Ask a question about the document"
                />
                <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
                  Ask
                </button>
              </form>
              <ul className="lg-type-compact" style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
                {(source.questions ?? []).map((q) => (
                  <li key={q.id}>
                    <strong>{q.question}</strong> · {q.answerability}
                    <div>{q.answerText}</div>
                    {q.reason ? <div style={{ opacity: 0.7 }}>{q.reason}</div> : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Help me reply</h2>
              <form onSubmit={onReply} className="lg-card" style={{ display: 'grid', gap: '0.5rem' }}>
                <textarea
                  className="vl-field"
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  aria-label="Your reply in your words"
                />
                <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
                  Draft reply
                </button>
              </form>
              <ul className="lg-type-compact" style={{ display: 'grid', gap: '1rem', marginTop: '0.75rem' }}>
                {(view?.replies ?? []).map((r) => (
                  <li key={r.id} className="lg-card">
                    <div style={{ opacity: 0.7 }}>Your wording</div>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{r.userSourceText}</pre>
                    <div style={{ opacity: 0.7, marginTop: '0.5rem' }}>Target draft</div>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{r.targetText}</pre>
                    {r.criticalFindings?.length ? (
                      <ul style={{ color: '#92400e', paddingLeft: '1.2rem' }}>
                        {r.criticalFindings.map((f) => (
                          <li key={f.code}>{f.message}</li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary"
                      style={{ marginTop: '0.5rem' }}
                      disabled={busy || r.approvals.length > 0}
                      onClick={() => void approve(r.id, r.userSourceHash, r.targetHash)}
                    >
                      {r.approvals.length ? 'Approved — copied' : 'Approve and copy'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Explain this word</h2>
              <form onSubmit={onTerm} className="lg-card" style={{ display: 'grid', gap: '0.5rem' }}>
                <input
                  className="vl-field"
                  value={termSpan}
                  onChange={(e) => setTermSpan(e.target.value)}
                  aria-label="Word or phrase from the document"
                />
                <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
                  Explain in document
                </button>
              </form>
              <ul className="lg-type-compact" style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
                {(view?.terms ?? []).map((t) => (
                  <li key={t.id}>
                    <strong>{t.selectedSpan}</strong> ({t.scope}) — {t.definition}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader, FeaturePanel } from '@/components/platform';
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
          description={
            view
              ? `${view.session.corridor} · ${view.session.state}. Private processing — not end-to-end encryption.`
              : 'Loading…'
          }
          actions={
            <>
              <Link href="/everyday" className="vl-btn vl-btn-secondary">
                Home
              </Link>
              <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void onDelete()}>
                Delete
              </button>
            </>
          }
        />

        {!auth.signedIn ? (
          <FeaturePanel title="Connect">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="vl-input"
                value={auth.apiKey}
                onChange={(e) => auth.setApiKey(e.target.value)}
                placeholder="lg_…"
              />
              <input
                className="vl-input"
                value={auth.actorId}
                onChange={(e) => auth.setActorId(e.target.value)}
                placeholder="Actor id"
              />
              <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
                Load
              </button>
            </div>
          </FeaturePanel>
        ) : null}

        {error ? <p className="text-sm text-red-700 mt-2">{error}</p> : null}

        <FeaturePanel title="Capture or upload">
          <p className="text-sm opacity-80 mb-3">
            Documents are stored privately for your organization. Training consent stays off unless you
            opt in when creating the session.
          </p>
          <form onSubmit={onUpload} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input name="file" type="file" accept="image/*,.pdf,.txt" capture="environment" className="vl-input" />
            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
              {busy ? 'Working…' : 'Upload'}
            </button>
          </form>
          {document?.status === 'recapture_required' ? (
            <ul className="mt-3 text-sm text-amber-800 list-disc pl-5">
              {(document.qualityReport?.findings ?? []).map((f) => (
                <li key={f.message}>{f.message}</li>
              ))}
            </ul>
          ) : null}
        </FeaturePanel>

        {source ? (
          <>
            <FeaturePanel title="Source and OCR review">
              <pre className="whitespace-pre-wrap text-sm bg-black/5 p-3 rounded-md max-h-64 overflow-auto">
                {source.fullText}
              </pre>
              {uncertain.length ? (
                <p className="text-sm mt-2 opacity-80">
                  Uncertain values highlighted in OCR: {uncertain.map((b) => b.id).join(', ')}. Correct
                  before trusting deadlines or amounts.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void runTranslate()}>
                  Translate (faithful)
                </button>
                <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void runExplain()}>
                  Explain (plain language)
                </button>
              </div>
            </FeaturePanel>

            <FeaturePanel title="Translation and explanation">
              <div className="flex gap-2 mb-3" role="tablist" aria-label="Translation or explanation">
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
              <label className="text-sm block mb-2">
                Playback speed
                <input
                  type="range"
                  min={0.75}
                  max={1.5}
                  step={0.25}
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="ml-2 align-middle"
                />{' '}
                {playbackRate}x
              </label>
              {tab === 'faithful' ? (
                <div>
                  <pre className="whitespace-pre-wrap text-sm bg-black/5 p-3 rounded-md">
                    {translation?.faithfulText ?? 'Run Translate to hear and read the faithful rendering.'}
                  </pre>
                  {translation ? (
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary mt-2"
                      disabled={busy}
                      onClick={() => void playAudio('translation', translation.id)}
                    >
                      Read translation aloud
                    </button>
                  ) : null}
                </div>
              ) : (
                <div>
                  <pre className="whitespace-pre-wrap text-sm bg-black/5 p-3 rounded-md">
                    {explanation?.simplifiedText ??
                      'Run Explain for a separately labeled plain-language summary with evidence.'}
                  </pre>
                  {explanation ? (
                    <>
                      <p className="text-xs mt-2 opacity-70">{explanation.adviceDisclaimer}</p>
                      <button
                        type="button"
                        className="vl-btn vl-btn-secondary mt-2"
                        disabled={busy}
                        onClick={() => void playAudio('explanation', explanation.id)}
                      >
                        Read explanation aloud
                      </button>
                    </>
                  ) : null}
                </div>
              )}
            </FeaturePanel>

            <FeaturePanel title="Grounded questions">
              <form onSubmit={runQuestion} className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="vl-input flex-1"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  aria-label="Ask a question about the document"
                />
                <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
                  Ask
                </button>
              </form>
              <ul className="mt-3 space-y-2 text-sm">
                {(source.questions ?? []).map((q) => (
                  <li key={q.id}>
                    <strong>{q.question}</strong> · {q.answerability}
                    <div>{q.answerText}</div>
                    {q.reason ? <div className="opacity-70">{q.reason}</div> : null}
                  </li>
                ))}
              </ul>
            </FeaturePanel>

            <FeaturePanel title="Help me reply">
              <form onSubmit={onReply} className="flex flex-col gap-2">
                <textarea
                  className="vl-input min-h-[100px]"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  aria-label="Your reply in your words"
                />
                <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
                  Draft reply
                </button>
              </form>
              <ul className="mt-3 space-y-3 text-sm">
                {(view?.replies ?? []).map((r) => (
                  <li key={r.id} className="border-t border-black/10 pt-3">
                    <div className="opacity-70">Your wording</div>
                    <pre className="whitespace-pre-wrap">{r.userSourceText}</pre>
                    <div className="opacity-70 mt-2">Target draft</div>
                    <pre className="whitespace-pre-wrap">{r.targetText}</pre>
                    {r.criticalFindings?.length ? (
                      <ul className="text-amber-800 list-disc pl-5 mt-1">
                        {r.criticalFindings.map((f) => (
                          <li key={f.code}>{f.message}</li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary mt-2"
                      disabled={busy || r.approvals.length > 0}
                      onClick={() => void approve(r.id, r.userSourceHash, r.targetHash)}
                    >
                      {r.approvals.length ? 'Approved — copied' : 'Approve and copy'}
                    </button>
                  </li>
                ))}
              </ul>
            </FeaturePanel>

            <FeaturePanel title="Explain this word">
              <form onSubmit={onTerm} className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="vl-input flex-1"
                  value={termSpan}
                  onChange={(e) => setTermSpan(e.target.value)}
                  aria-label="Word or phrase from the document"
                />
                <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
                  Explain in document
                </button>
              </form>
              <ul className="mt-3 space-y-2 text-sm">
                {(view?.terms ?? []).map((t) => (
                  <li key={t.id}>
                    <strong>{t.selectedSpan}</strong> ({t.scope}) — {t.definition}
                  </li>
                ))}
              </ul>
            </FeaturePanel>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

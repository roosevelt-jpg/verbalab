'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch, API_URL } from '@/lib/api';
import { LearnBackAuthGate, type LearnBackAuthBag } from '@/lib/learnback-auth';

type FeedbackView = {
  attempt: { id: string; attemptNumber: number; state: string; audioHash?: string | null };
  transcript: {
    id: string;
    asrText: string;
    editedText: string;
    uncertainty: string;
    origin: string;
  } | null;
  evaluation: {
    id: string;
    status: string;
    findings: Array<{
      dimension: string;
      evidence: string;
      suggestionIntent: string;
      note?: string;
    }>;
    unassessedDimensions: string[];
    pronunciationStatus: string;
    pronunciationReason?: string | null;
    stale: boolean;
  } | null;
  feedback: {
    id: string;
    localizedExplanation: string;
    improvedExample: string;
    exampleLabel: string;
    placeholders: string[];
    stale: boolean;
  } | null;
};

type SessionView = {
  session: {
    id: string;
    corridorId: string;
    situation: string;
    state: string;
    explanationLanguage: string;
    practiceLanguage: string;
    fictionalMode: boolean;
    scenarioPack: {
      questionText: string;
      questionExplanation: string;
      followUpPrompts: string[];
      phraseExamples: Array<{ phrase: string; meaning: string }>;
      revision: string;
    };
  };
  attempts: Array<{
    id: string;
    attemptNumber: number;
    state: string;
    transcripts: Array<{ id: string; editedText: string; uncertainty: string }>;
    evaluations: Array<{
      id: string;
      status: string;
      pronunciationStatus: string;
      findings: unknown[];
    }>;
    feedback: Array<{
      id: string;
      localizedExplanation: string;
      improvedExample: string;
      exampleLabel: string;
    }>;
  }>;
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function LearnBackSessionClient({ sessionId }: { sessionId: string }) {
  return (
    <LearnBackAuthGate>
      {(auth) => <SessionFlow sessionId={sessionId} auth={auth} />}
    </LearnBackAuthGate>
  );
}

function SessionFlow({
  sessionId,
  auth,
}: {
  sessionId: string;
  auth: LearnBackAuthBag;
}) {
  const [view, setView] = useState<SessionView | null>(null);
  const [feedback, setFeedback] = useState<FeedbackView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [editedText, setEditedText] = useState('');
  const [recording, setRecording] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const a = await auth.authHeaders();
      const headers = a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined;
      const res = await apiFetch<SessionView>(`/v1/learnback/sessions/${sessionId}`, {
        token: a.token,
        headers,
      });
      setView(res);
      const last = res.attempts[res.attempts.length - 1];
      if (last) {
        const fb = await apiFetch<FeedbackView>(`/v1/learnback/attempts/${last.id}/feedback`, {
          token: a.token,
          headers,
        });
        setFeedback(fb);
        setEditedText(fb.transcript?.editedText ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load session');
    }
  }, [auth, sessionId]);

  useEffect(() => {
    if (auth.ready) void load();
  }, [load, auth.ready]);

  async function playTts(kind: 'question' | 'explanation' | 'example', text: string, language: string) {
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const headers = a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined;
      const audio = await apiFetch<{ audio: { id: string; hasBytes: boolean; note?: string } }>(
        '/v1/learnback/audio',
        {
          method: 'POST',
          token: a.token,
          headers,
          body: { kind, text, language },
        },
      );
      if (!audio.audio.hasBytes) {
        setError(audio.audio.note ?? 'Audio unavailable for this language — text remains available.');
        return;
      }
      const url = `${API_URL}/v1/learnback/artifacts/${audio.audio.id}/audio`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${a.token}`,
          ...(headers ?? {}),
        },
      });
      if (!res.ok) throw new Error('Could not fetch audio');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const el = new Audio(objectUrl);
      el.playbackRate = playbackRate;
      await el.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playback failed');
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer(payload: {
    contentBase64?: string;
    mimeType?: string;
    textAnswer?: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/learnback/sessions/${sessionId}/attempts`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
        body: {
          ...payload,
          idempotencyKey: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      });
      setTextAnswer('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Attempt failed');
    } finally {
      setBusy(false);
    }
  }

  async function onTextSubmit(e: FormEvent) {
    e.preventDefault();
    if (!textAnswer.trim()) {
      setError('Type an answer or record audio');
      return;
    }
    await submitAnswer({ textAnswer });
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone unavailable. Use text input instead.');
    }
  }

  async function stopAndSubmit() {
    const recorder = mediaRef.current;
    if (!recorder) return;
    setRecording(false);
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
    const contentBase64 = await blobToBase64(blob);
    await submitAnswer({
      contentBase64,
      mimeType: blob.type || 'audio/webm',
      textAnswer: textAnswer.trim() || undefined,
    });
  }

  async function onCorrectTranscript(e: FormEvent) {
    e.preventDefault();
    if (!feedback?.attempt?.id || !editedText.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const fb = await apiFetch<FeedbackView>(
        `/v1/learnback/attempts/${feedback.attempt.id}/transcript-revisions`,
        {
          method: 'POST',
          token: a.token,
          headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
          body: {
            editedText,
            expectedTranscriptRevisionId: feedback.transcript?.id,
          },
        },
      );
      setFeedback(fb);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Correction failed');
    } finally {
      setBusy(false);
    }
  }

  async function savePhrase() {
    if (!feedback?.feedback?.improvedExample) return;
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch('/v1/learnback/phrasebook', {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
        body: {
          phrase: feedback.feedback.improvedExample.slice(0, 240),
          intendedMeaning: 'Saved from practice feedback',
          context: view?.session.situation,
          sourceAttemptId: feedback.attempt.id,
          practiceLanguage: view?.session.practiceLanguage,
          explanationLanguage: view?.session.explanationLanguage,
        },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save phrase');
    } finally {
      setBusy(false);
    }
  }

  async function deleteSession() {
    if (!confirm('Delete this practice session and unlink private audio?')) return;
    setBusy(true);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/learnback/sessions/${sessionId}`, {
        method: 'DELETE',
        token: a.token,
        headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
      });
      window.location.href = '/learnback';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  }

  const pack = view?.session.scenarioPack;

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="LearnBack practice"
          title={pack?.questionText ?? 'Practice session'}
          lede={
            view?.session.fictionalMode
              ? 'Fictional practice mode — answers are for skill practice only.'
              : 'Meaning-first feedback. Correct recognition errors before they affect coaching.'
          }
        >
          <div className="lg-page-header__actions">
            <Link href="/learnback" className="vl-btn vl-btn-secondary">
              All sessions
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Refresh
            </button>
            <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void deleteSession()}>
              Delete
            </button>
          </div>
        </PageHeader>

        {!auth.signedIn ? (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
            <input
              className="vl-field"
              placeholder="lg_live_… or lg_test_…"
              value={auth.apiKey}
              onChange={(e) => auth.setApiKey(e.target.value)}
            />
            <input
              className="vl-field"
              placeholder="Actor id"
              value={auth.actorId}
              onChange={(e) => auth.setActorId(e.target.value)}
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

        {pack ? (
          <section className="lg-page-section">
            <h2 className="lg-type-section">Prompt</h2>
            <p className="lg-type-compact">{pack.questionExplanation}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                disabled={busy}
                onClick={() =>
                  void playTts('question', pack.questionText, view!.session.practiceLanguage)
                }
              >
                Hear question
              </button>
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                disabled={busy}
                onClick={() =>
                  void playTts(
                    'explanation',
                    pack.questionExplanation,
                    view!.session.explanationLanguage,
                  )
                }
              >
                Hear explanation
              </button>
              <label className="lg-type-compact">
                Speed{' '}
                <input
                  type="range"
                  min={0.75}
                  max={1.5}
                  step={0.25}
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                />
              </label>
            </div>
            {pack.followUpPrompts?.length ? (
              <ul className="lg-type-compact" style={{ paddingLeft: '1.2rem' }}>
                {pack.followUpPrompts.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <section className="lg-page-section" aria-labelledby="lb-answer">
          <h2 id="lb-answer" className="lg-type-section">
            Your answer
          </h2>
          <p className="lg-type-compact">
            Microphone is optional. Text input is always available. Preview and retry before you
            rely on feedback.
          </p>
          <form onSubmit={onTextSubmit} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
            <label className="vl-field-label">
              Typed answer
              <textarea
                className="vl-field"
                rows={5}
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Tell your story in the practice language…"
              />
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button type="submit" className="vl-btn vl-btn-primary" disabled={busy || !auth.ready}>
                {busy ? 'Processing…' : 'Submit text answer'}
              </button>
              {!recording ? (
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy}
                  onClick={() => void startRecording()}
                >
                  Record audio
                </button>
              ) : (
                <button
                  type="button"
                  className="vl-btn vl-btn-primary"
                  disabled={busy}
                  onClick={() => void stopAndSubmit()}
                >
                  Stop & submit recording
                </button>
              )}
            </div>
          </form>
        </section>

        {feedback?.transcript ? (
          <section className="lg-page-section">
            <h2 className="lg-type-section">Transcript review</h2>
            <p className="lg-type-compact">
              Uncertainty: {feedback.transcript.uncertainty}. Recognition mistakes are not your
              errors — correct them before feedback is final.
            </p>
            <form onSubmit={onCorrectTranscript} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
              <textarea
                className="vl-field"
                rows={4}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
              />
              <button type="submit" className="vl-btn vl-btn-secondary" disabled={busy}>
                Save correction & refresh feedback
              </button>
            </form>
          </section>
        ) : null}

        {feedback?.feedback ? (
          <section className="lg-page-section">
            <h2 className="lg-type-section">Feedback</h2>
            <p>{feedback.feedback.localizedExplanation}</p>
            <div className="lg-card" style={{ marginTop: '0.75rem' }}>
              <p className="lg-type-compact">
                Example ({feedback.feedback.exampleLabel.replace(/_/g, ' ')}) — not a claim about
                your history:
              </p>
              <p>{feedback.feedback.improvedExample}</p>
              {feedback.feedback.placeholders?.length ? (
                <ul className="lg-type-compact">
                  {feedback.feedback.placeholders.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                style={{ marginTop: '0.5rem' }}
                disabled={busy}
                onClick={() =>
                  void playTts(
                    'example',
                    feedback.feedback!.improvedExample,
                    view!.session.practiceLanguage,
                  )
                }
              >
                Hear example
              </button>
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                style={{ marginLeft: '0.5rem', marginTop: '0.5rem' }}
                disabled={busy}
                onClick={() => void savePhrase()}
              >
                Save to phrasebook
              </button>
            </div>
            {feedback.evaluation ? (
              <div style={{ marginTop: '0.75rem' }}>
                <p className="lg-type-compact">
                  Pronunciation: {feedback.evaluation.pronunciationStatus}
                  {feedback.evaluation.pronunciationReason
                    ? ` — ${feedback.evaluation.pronunciationReason}`
                    : ''}
                </p>
                <ul className="lg-type-compact" style={{ paddingLeft: '1.2rem' }}>
                  {(feedback.evaluation.findings ?? []).map((f, i) => (
                    <li key={`${f.dimension}-${i}`}>
                      <strong>{f.dimension}</strong>: {f.note ?? f.suggestionIntent} (from “
                      {f.evidence.slice(0, 80)}”)
                    </li>
                  ))}
                </ul>
                <p className="lg-type-compact">
                  Unassessed: {(feedback.evaluation.unassessedDimensions ?? []).join(', ') || 'none'}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {view?.attempts?.length ? (
          <section className="lg-page-section">
            <h2 className="lg-type-section">Attempts</h2>
            <ul className="lg-type-compact" style={{ paddingLeft: '1.2rem' }}>
              {view.attempts.map((a) => (
                <li key={a.id}>
                  #{a.attemptNumber} · {a.state}
                  {a.transcripts[0] ? ` · “${a.transcripts[0].editedText.slice(0, 60)}”` : ''}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

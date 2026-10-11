'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { LearnBackAuthGate, type LearnBackAuthBag } from '@/lib/learnback-auth';

type Observation = {
  id: string;
  skill: string;
  rubricVersion: string;
  evidence: string;
  assisted: boolean;
  note?: string | null;
  createdAt: string;
};

type Profile = {
  reminderOptIn: boolean;
  reminderTimezone?: string | null;
  reminderChannel?: string | null;
  quietHoursStart?: number | null;
  quietHoursEnd?: number | null;
};

export function LearnBackProgressClient() {
  return (
    <LearnBackAuthGate>{(auth) => <ProgressFlow auth={auth} />}</LearnBackAuthGate>
  );
}

function ProgressFlow({ auth }: { auth: LearnBackAuthBag }) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [note, setNote] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [timezone, setTimezone] = useState('Africa/Accra');
  const [channel, setChannel] = useState('in_app');
  const [quietStart, setQuietStart] = useState(22);
  const [quietEnd, setQuietEnd] = useState(7);

  const load = useCallback(async () => {
    if (!auth.ready) return;
    setError(null);
    try {
      const a = await auth.authHeaders();
      const headers = a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined;
      const progress = await apiFetch<{
        observations: Observation[];
        note: string;
      }>('/v1/learnback/progress', { token: a.token, headers });
      setObservations(progress.observations ?? []);
      setNote(progress.note ?? '');
      const prof = await apiFetch<{ profile: Profile }>('/v1/learnback/profile', {
        token: a.token,
        headers,
      });
      setProfile(prof.profile);
      setOptIn(Boolean(prof.profile?.reminderOptIn));
      setTimezone(prof.profile?.reminderTimezone ?? 'Africa/Accra');
      setChannel(prof.profile?.reminderChannel ?? 'in_app');
      setQuietStart(prof.profile?.quietHoursStart ?? 22);
      setQuietEnd(prof.profile?.quietHoursEnd ?? 7);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load progress');
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onReminders(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch('/v1/learnback/reminder-preferences', {
        method: 'PATCH',
        token: a.token,
        headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
        body: {
          reminderOptIn: optIn,
          reminderTimezone: timezone,
          reminderChannel: channel,
          quietHoursStart: quietStart,
          quietHoursEnd: quietEnd,
        },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update reminders');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="LearnBack"
          title="Progress evidence"
          lede="Comparable-task observations from assisted practice — not a standardized proficiency certificate."
        >
          <div className="lg-page-header__actions">
            <Link href="/learnback" className="vl-btn vl-btn-secondary">
              Back
            </Link>
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

        {note ? <p className="lg-type-compact">{note}</p> : null}

        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
          {!observations.length ? (
            <li className="lg-type-compact">No observations yet — complete a practice attempt.</li>
          ) : (
            observations.map((o) => (
              <li key={o.id} className="lg-card">
                <strong>{o.skill}</strong>
                <p className="lg-type-compact">
                  {o.evidence.slice(0, 160)}
                  {o.assisted ? ' · assisted' : ' · unassisted'}
                </p>
                {o.note ? <p className="lg-type-compact">{o.note}</p> : null}
              </li>
            ))
          )}
        </ul>

        <section className="lg-page-section">
          <h2 className="lg-type-section">Reminder preferences</h2>
          <p className="lg-type-compact">
            Opt-in only. Without external notification infrastructure, due items stay in-app.
            Current: {profile?.reminderOptIn ? 'opted in' : 'opted out'}.
          </p>
          <form onSubmit={onReminders} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
            <label className="lg-type-compact" style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
              Remind me to practise
            </label>
            <label className="vl-field-label">
              Timezone
              <input className="vl-field" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </label>
            <label className="vl-field-label">
              Channel
              <select className="vl-field" value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="in_app">In-app due list</option>
              </select>
            </label>
            <label className="vl-field-label">
              Quiet hours start (0–23)
              <input
                className="vl-field"
                type="number"
                min={0}
                max={23}
                value={quietStart}
                onChange={(e) => setQuietStart(Number(e.target.value))}
              />
            </label>
            <label className="vl-field-label">
              Quiet hours end (0–23)
              <input
                className="vl-field"
                type="number"
                min={0}
                max={23}
                value={quietEnd}
                onChange={(e) => setQuietEnd(Number(e.target.value))}
              />
            </label>
            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy || !auth.ready}>
              Save reminders
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}

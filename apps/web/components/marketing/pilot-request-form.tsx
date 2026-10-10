'use client';

import { useState, type FormEvent } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const ORG_TYPES = [
  { value: 'un-agency', label: 'UN agency or programme' },
  { value: 'ngo', label: 'NGO / humanitarian organisation' },
  { value: 'government', label: 'Government or ministry' },
  { value: 'health', label: 'Health organisation' },
  { value: 'education', label: 'University or school' },
  { value: 'enterprise', label: 'Company' },
  { value: 'other', label: 'Other' },
];

const USE_CASES = [
  { value: 'listen-live', label: 'Listen in your language (live meetings)' },
  { value: 'messages', label: 'One message, every language (audio & text)' },
  { value: 'documents', label: 'Documents with a human check' },
  { value: 'other', label: 'Something else' },
];

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

export function PilotRequestForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch(`${API_URL}/v1/pilot-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(data?.error?.message ?? 'Something went wrong. Please try again.');
      }
      form.reset();
      setStatus({ kind: 'sent' });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      });
    }
  }

  if (status.kind === 'sent') {
    return (
      <div className="org-form org-form-done" role="status">
        <h3>Thank you — we have your request.</h3>
        <p>We will reply by email within a few working days with a proposed pilot.</p>
        <button type="button" className="vl-btn" onClick={() => setStatus({ kind: 'idle' })}>
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form className="org-form" onSubmit={onSubmit}>
      <div className="org-form-row">
        <label>
          <span>Your name</span>
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          <span>Work email</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" />
        </label>
      </div>
      <div className="org-form-row">
        <label>
          <span>Organisation</span>
          <input name="organization" required maxLength={200} autoComplete="organization" />
        </label>
        <label>
          <span>Type of organisation</span>
          <select name="orgType" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {ORG_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="org-form-row">
        <label>
          <span>Country or region</span>
          <input name="country" maxLength={120} autoComplete="country-name" />
        </label>
        <label>
          <span>What would you like to pilot?</span>
          <select name="useCase" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {USE_CASES.map((useCase) => (
              <option key={useCase.value} value={useCase.value}>
                {useCase.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>Languages your communities speak</span>
        <input name="languages" maxLength={500} placeholder="e.g. Asante Twi, Dagbani, Ewe" />
      </label>
      <label>
        <span>Tell us about the programme (optional)</span>
        <textarea name="message" rows={4} maxLength={4000} />
      </label>
      <label className="org-form-trap" aria-hidden="true">
        <span>Website</span>
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {status.kind === 'error' ? (
        <p className="org-form-error" role="alert">
          {status.message}
        </p>
      ) : null}
      <button type="submit" className="vl-btn vl-btn-primary" disabled={status.kind === 'sending'}>
        {status.kind === 'sending' ? 'Sending…' : 'Request a pilot'}
      </button>
    </form>
  );
}

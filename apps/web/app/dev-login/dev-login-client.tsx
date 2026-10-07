'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { SKIP_ONBOARDING_PATH } from '@/lib/onboarding';
import {
  LIVE_CLERK_LOCAL_ORIGIN,
  isBareLocalDevHost,
  isLiveClerkPublishableKey,
  liveClerkLocalUrl,
} from '@/lib/live-clerk-local-origin';

function liveKeysNeedLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isLiveClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) return false;
  return isBareLocalDevHost(window.location.hostname);
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background:
          'radial-gradient(1200px 600px at 10% -10%, rgba(15,118,110,0.18), transparent), #f7f4ef',
      }}
    >
      <div
        style={{
          width: 'min(28rem, 100%)',
          border: '1px solid #e5e0d6',
          borderRadius: '1rem',
          padding: '1.75rem',
          background: '#fffdf8',
          boxShadow: '0 18px 50px rgba(28, 25, 23, 0.08)',
        }}
      >
        {children}
      </div>
    </main>
  );
}

/** Shown on bare localhost with pk_live_ — no Clerk hooks (avoids FAPI _baseFetch overlay). */
function DevLoginRedirectPanel() {
  const dest = liveClerkLocalUrl('/dev-login');

  useEffect(() => {
    window.location.replace(dest);
  }, [dest]);

  return (
    <Shell>
      <p style={{ margin: 0, color: '#0f766e', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>
        LOCAL DEV LOGIN
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', margin: '0.4rem 0 0.5rem', fontSize: '1.6rem' }}>
        Use the HTTPS proxy
      </h1>
      <p
        style={{
          color: '#92400e',
          background: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: '0.65rem',
          padding: '0.75rem 0.9rem',
          margin: '0 0 1rem',
          lineHeight: 1.45,
          fontSize: '0.9rem',
        }}
      >
        Live Clerk keys reject Origin <code>http://127.0.0.1</code> / <code>localhost</code>. Continue on{' '}
        <a href={dest} style={{ color: '#0f766e', fontWeight: 700 }}>
          {dest}
        </a>{' '}
        (hosts → 127.0.0.1, HTTPS :443 → Next :43125, Frontend API{' '}
        <code style={{ fontSize: '0.85em' }}>clerk.lugemi.com</code>).
      </p>
      <a
        href={dest}
        style={{
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center',
          border: 0,
          borderRadius: '0.65rem',
          padding: '0.85rem 1rem',
          background: '#0f766e',
          color: 'white',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        Continue on local.lugemi.com
      </a>
    </Shell>
  );
}

function DevLoginTicketForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('local.reviewer@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [skipOnboarding, setSkipOnboarding] = useState(true);

  async function completeSession(sessionId: string | null | undefined) {
    if (!sessionId || !setActive) throw new Error('No session created');
    await setActive({ session: sessionId });
    router.replace(skipOnboarding ? SKIP_ONBOARDING_PATH : '/onboarding');
  }

  async function signInWithTicket() {
    if (liveKeysNeedLocalHost()) {
      window.location.replace(liveClerkLocalUrl('/dev-login'));
      return;
    }
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    setStatus('Minting sign-in ticket…');
    try {
      const res = await fetch('/api/dev-login', { method: 'POST' });
      const data = (await res.json()) as {
        ticket?: string;
        email?: string;
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.ticket) {
        throw new Error(data.message || data.error || `Ticket mint failed (${res.status})`);
      }
      if (data.email) setEmail(data.email);
      setStatus('Completing ticket sign-in…');
      const result = await signIn.create({ strategy: 'ticket', ticket: data.ticket });
      if (result.status === 'complete') {
        await completeSession(result.createdSessionId);
        return;
      }
      throw new Error(
        `Ticket sign-in incomplete: status=${result.status}. Check Clerk email-code settings.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    setStatus('Signing in with password…');
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        strategy: 'password',
        password,
      });
      if (result.status === 'complete') {
        await completeSession(result.createdSessionId);
        return;
      }
      const first = result.supportedFirstFactors?.map((f) => f.strategy).join(', ');
      const second = result.supportedSecondFactors?.map((f) => f.strategy).join(', ');
      throw new Error(
        `Password sign-in incomplete: status=${result.status}` +
          (first ? `; firstFactors=${first}` : '') +
          (second ? `; secondFactors=${second}` : '') +
          '. Use “Sign in without OTP” instead.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  return (
    <Shell>
      <p style={{ margin: 0, color: '#0f766e', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>
        LOCAL DEV LOGIN
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', margin: '0.4rem 0 0.5rem', fontSize: '1.6rem' }}>
        Skip Clerk OTP
      </h1>
      <p style={{ color: '#78716c', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
        This instance’s hosted Sign-in UI prefers email codes. Use the ticket button below for a
        one-click session. Live keys require{' '}
        <code style={{ fontSize: '0.85em' }}>{LIVE_CLERK_LOCAL_ORIGIN}</code> (Frontend API{' '}
        <code style={{ fontSize: '0.85em' }}>clerk.lugemi.com</code>).
      </p>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          color: '#57534e',
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={skipOnboarding}
          onChange={(e) => setSkipOnboarding(e.target.checked)}
        />
        Skip setup → Creative Studio
      </label>

      <button
        type="button"
        disabled={!isLoaded || busy}
        onClick={() => void signInWithTicket()}
        style={{
          width: '100%',
          border: 0,
          borderRadius: '0.65rem',
          padding: '0.85rem 1rem',
          background: '#0f766e',
          color: 'white',
          fontWeight: 700,
          cursor: busy ? 'wait' : 'pointer',
          marginBottom: '1rem',
        }}
      >
        {busy ? 'Working…' : 'Sign in without OTP'}
      </button>

      <details>
        <summary style={{ cursor: 'pointer', color: '#57534e', marginBottom: '0.75rem' }}>
          Or try email + password
        </summary>
        <form onSubmit={(e) => void signInWithPassword(e)} style={{ display: 'grid', gap: '0.65rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem' }}>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              style={{ padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #d6d3d1' }}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem' }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{ padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #d6d3d1' }}
            />
          </label>
          <button
            type="submit"
            disabled={!isLoaded || busy || !password}
            style={{
              border: 0,
              borderRadius: '0.65rem',
              padding: '0.75rem 1rem',
              background: '#1c1917',
              color: 'white',
              fontWeight: 650,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            Sign in with password
          </button>
        </form>
      </details>

      {status ? <p style={{ color: '#0f766e', margin: '1rem 0 0' }}>{status}</p> : null}
      {error ? (
        <p style={{ color: '#b42318', margin: '1rem 0 0', whiteSpace: 'pre-wrap' }}>{error}</p>
      ) : null}
    </Shell>
  );
}

export function DevLoginClient() {
  const [needsLocalHost, setNeedsLocalHost] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const needs = liveKeysNeedLocalHost();
    setNeedsLocalHost(needs);
    setReady(true);
    if (needs) {
      window.location.replace(liveClerkLocalUrl('/dev-login'));
    }
  }, []);

  if (!ready) {
    return (
      <Shell>
        <p style={{ margin: 0, color: '#78716c' }}>Checking Clerk Origin…</p>
      </Shell>
    );
  }

  if (needsLocalHost) {
    return <DevLoginRedirectPanel />;
  }

  return <DevLoginTicketForm />;
}

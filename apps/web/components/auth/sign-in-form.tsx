'use client';

import { lazy, Suspense, useState } from 'react';
import Link from 'next/link';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { authBackend } from '@/lib/auth/config';
import { firebaseAuthErrorMessage } from '@/lib/auth/firebase-errors';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { syncAuthSessionCookie } from '@/lib/auth/session-cookie';

type SignInFormProps = {
  hasSocial?: boolean;
  onSuccess: (sessionId: string) => Promise<void>;
};

const ClerkSignInForm = lazy(() => import('./sign-in-form-clerk'));

export function SignInForm({ hasSocial = false, onSuccess }: SignInFormProps) {
  if (authBackend() === 'firebase') {
    return <FirebaseSignInForm hasSocial={hasSocial} onSuccess={onSuccess} />;
  }
  return (
    <Suspense fallback={<div className="lugemi-auth-form">Loading…</div>}>
      <ClerkSignInForm hasSocial={hasSocial} onSuccess={onSuccess} />
    </Suspense>
  );
}

function FirebaseSignInForm({ hasSocial = false, onSuccess }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async (uid: string) => {
    const auth = getFirebaseAuth();
    const token = await auth.currentUser?.getIdToken(true);
    if (token) {
      const synced = await syncAuthSessionCookie(token);
      if (!synced.ok) {
        throw new Error(
          'Signed in with Firebase, but the session cookie could not be set. Refresh and try again.',
        );
      }
    }
    // Let AuthProvider observe onAuthStateChanged before /post-auth mounts.
    await new Promise((r) => setTimeout(r, 50));
    await onSuccess(uid);
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        const result = await signInWithPopup(auth, provider);
        await finish(result.user.uid);
      } catch (popupErr: unknown) {
        const code =
          typeof popupErr === 'object' && popupErr && 'code' in popupErr
            ? String((popupErr as { code: string }).code)
            : '';
        // Only fall back when the browser blocked the popup — not on cancel or OAuth misconfig.
        if (code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }
    } catch (err: unknown) {
      setError(firebaseAuthErrorMessage(err, { action: 'sign-in' }));
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );
      await finish(result.user.uid);
    } catch (err: unknown) {
      setError(firebaseAuthErrorMessage(err, { action: 'sign-in' }));
      setBusy(false);
    }
  };

  return (
    <form className="lugemi-auth-form" onSubmit={handleSubmit} noValidate>
      {hasSocial && (
        <>
          <button
            type="button"
            className="lugemi-auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={busy}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
          <div className="lugemi-auth-divider">
            <span>or</span>
          </div>
        </>
      )}

      {error && (
        <div className="lugemi-auth-error-alert" role="alert">
          {error}
        </div>
      )}

      <div className="lugemi-auth-field">
        <label className="lugemi-auth-label" htmlFor="email">
          Email address
        </label>
        <div className="lugemi-auth-input-wrap">
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="lugemi-auth-input"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />
        </div>
      </div>

      <div className="lugemi-auth-field">
        <div className="lugemi-auth-field-header">
          <label className="lugemi-auth-label" htmlFor="password">
            Password
          </label>
        </div>
        <div className="lugemi-auth-input-wrap">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="lugemi-auth-input lugemi-auth-input-with-toggle"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
          />
          <button
            type="button"
            className="lugemi-auth-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <button type="submit" className="lugemi-auth-submit-btn" disabled={busy}>
        <span>{busy ? 'Working…' : 'Continue'}</span>
      </button>

      <div className="lugemi-auth-sub-action">
        <span>Don&apos;t have an account? </span>
        <Link href="/sign-up">Sign up</Link>
      </div>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.27 21.39 7.35 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.13z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.26 6.59l4.02 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

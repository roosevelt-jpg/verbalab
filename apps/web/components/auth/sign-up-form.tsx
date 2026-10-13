'use client';

import { lazy, Suspense, useState } from 'react';
import Link from 'next/link';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
} from 'firebase/auth';
import { authBackend } from '@/lib/auth/config';
import { firebaseAuthErrorMessage } from '@/lib/auth/firebase-errors';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { syncAuthSessionCookie } from '@/lib/auth/session-cookie';

type SignUpFormProps = {
  hasSocial?: boolean;
  onSuccess: (sessionId: string) => Promise<void>;
};

const ClerkSignUpForm = lazy(() => import('./sign-up-form-clerk'));

export function SignUpForm({ hasSocial = false, onSuccess }: SignUpFormProps) {
  if (authBackend() === 'firebase') {
    return <FirebaseSignUpForm hasSocial={hasSocial} onSuccess={onSuccess} />;
  }
  return (
    <Suspense fallback={<div className="lugemi-auth-form">Loading…</div>}>
      <ClerkSignUpForm hasSocial={hasSocial} onSuccess={onSuccess} />
    </Suspense>
  );
}

function FirebaseSignUpForm({ hasSocial = false, onSuccess }: SignUpFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async (uid: string) => {
    const token = await getFirebaseAuth().currentUser?.getIdToken(true);
    if (token) {
      const synced = await syncAuthSessionCookie(token);
      if (!synced.ok) {
        throw new Error(
          'Account created, but the session cookie could not be set. Refresh and try signing in.',
        );
      }
    }
    await new Promise((r) => setTimeout(r, 50));
    await onSuccess(uid);
  };

  const handleGoogleSignUp = async () => {
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
        if (code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }
    } catch (err: unknown) {
      setError(firebaseAuthErrorMessage(err, { action: 'sign-up' }));
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );
      const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      await finish(result.user.uid);
    } catch (err: unknown) {
      setError(firebaseAuthErrorMessage(err, { action: 'sign-up' }));
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
            onClick={handleGoogleSignUp}
            disabled={busy}
          >
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

      <div className="lugemi-auth-row">
        <div className="lugemi-auth-field">
          <div className="lugemi-auth-field-header">
            <label className="lugemi-auth-label" htmlFor="first-name">
              First name
            </label>
            <span className="lugemi-auth-optional">Optional</span>
          </div>
          <div className="lugemi-auth-input-wrap">
            <input
              id="first-name"
              type="text"
              autoComplete="given-name"
              className="lugemi-auth-input"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <div className="lugemi-auth-field">
          <div className="lugemi-auth-field-header">
            <label className="lugemi-auth-label" htmlFor="last-name">
              Last name
            </label>
            <span className="lugemi-auth-optional">Optional</span>
          </div>
          <div className="lugemi-auth-input-wrap">
            <input
              id="last-name"
              type="text"
              autoComplete="family-name"
              className="lugemi-auth-input"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>
      </div>

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
            autoComplete="new-password"
            className="lugemi-auth-input lugemi-auth-input-with-toggle"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
            minLength={6}
          />
          <button
            type="button"
            className="lugemi-auth-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <button type="submit" className="lugemi-auth-submit-btn" disabled={busy}>
        <span>{busy ? 'Working…' : 'Continue'}</span>
      </button>

      <div className="lugemi-auth-sub-action">
        <span>Already have an account? </span>
        <Link href="/sign-in">Sign in</Link>
      </div>
    </form>
  );
}

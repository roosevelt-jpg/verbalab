'use client';

import { lazy, Suspense, useState } from 'react';
import Link from 'next/link';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { authBackend } from '@/lib/auth/config';
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
    const token = await getFirebaseAuth().currentUser?.getIdToken();
    if (token) await syncAuthSessionCookie(token);
    await onSuccess(uid);
  };

  const handleGoogleSignUp = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      await finish(result.user.uid);
    } catch (err: unknown) {
      setError(firebaseErrorMessage(err));
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
      setError(firebaseErrorMessage(err));
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

function firebaseErrorMessage(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-up was cancelled.';
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Sign-up failed. Please try again.';
}

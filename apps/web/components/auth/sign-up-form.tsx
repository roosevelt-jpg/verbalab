'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignUp } from '@clerk/nextjs';

type SignUpFormProps = {
  hasSocial?: boolean;
  onSuccess: (sessionId: string) => Promise<void>;
};

export function SignUpForm({ hasSocial = false, onSuccess }: SignUpFormProps) {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email code verification state
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    setBusy(true);
    setError(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Google sign-up could not be initiated.');
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setBusy(true);
    setError(null);

    try {
      if (verifying) {
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: code.trim(),
        });

        if (completeSignUp.status === 'complete') {
          if (completeSignUp.createdSessionId) {
            await setActive({ session: completeSignUp.createdSessionId });
            await onSuccess(completeSignUp.createdSessionId);
            return;
          }
        }
        throw new Error(`Verification status: ${completeSignUp.status}`);
      }

      const cleanEmail = email.trim();
      const params: Parameters<typeof signUp.create>[0] = {
        emailAddress: cleanEmail,
        password,
      };
      if (firstName.trim()) {
        params.firstName = firstName.trim();
      }
      if (lastName.trim()) {
        params.lastName = lastName.trim();
      }

      await signUp.create(params);

      // Prepare verification if email_code is required
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setVerifying(true);
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string; longMessage?: string }> };
      if (clerkErr?.errors?.[0]) {
        setError(clerkErr.errors[0].longMessage || clerkErr.errors[0].message);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="lugemi-auth-form" onSubmit={handleSubmit} noValidate>
      {/* Clerk bot-protection widget (Turnstile). Required when Attack Protection CAPTCHA is on. */}
      <div id="clerk-captcha" className="lugemi-auth-captcha" />
      {hasSocial && !verifying && (
        <>
          <button
            type="button"
            className="lugemi-auth-google-btn"
            onClick={handleGoogleSignUp}
            disabled={!isLoaded || busy}
          >
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

      {verifying ? (
        <div className="lugemi-auth-field">
          <label className="lugemi-auth-label" htmlFor="email-verification-code">
            Verification code
          </label>
          <div className="lugemi-auth-input-wrap">
            <input
              id="email-verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="lugemi-auth-input"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={busy}
              required
            />
          </div>
          <p className="lugemi-auth-optional" style={{ marginTop: '0.25rem' }}>
            We sent a verification code to {email}.
          </p>
        </div>
      ) : (
        <>
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
              />
              <button
                type="button"
                className="lugemi-auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        className="lugemi-auth-submit-btn"
        disabled={!isLoaded || busy}
      >
        <span>{busy ? 'Working…' : verifying ? 'Verify email' : 'Continue'}</span>
        {!busy && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </button>

      <div className="lugemi-auth-sub-action">
        <span>Already have an account? </span>
        <Link href="/sign-in">Sign in</Link>
      </div>
    </form>
  );
}

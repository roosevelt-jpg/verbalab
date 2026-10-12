'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignUp } from '@clerk/nextjs';

type SignUpFormProps = {
  hasSocial?: boolean;
  onSuccess: (sessionId: string) => Promise<void>;
};

export default function ClerkSignUpForm({ hasSocial = false, onSuccess }: SignUpFormProps) {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        redirectUrlComplete: '/post-auth',
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

        if (completeSignUp.status === 'complete' && completeSignUp.createdSessionId) {
          await setActive({ session: completeSignUp.createdSessionId });
          await onSuccess(completeSignUp.createdSessionId);
          return;
        }
        throw new Error(`Verification status: ${completeSignUp.status}`);
      }

      const params: Parameters<typeof signUp.create>[0] = {
        emailAddress: email.trim(),
        password,
      };
      if (firstName.trim()) params.firstName = firstName.trim();
      if (lastName.trim()) params.lastName = lastName.trim();

      await signUp.create(params);
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
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
      <div id="clerk-captcha" className="lugemi-auth-captcha" />
      {hasSocial && !verifying && (
        <>
          <button type="button" className="lugemi-auth-google-btn" onClick={handleGoogleSignUp} disabled={!isLoaded || busy}>
            <span>Continue with Google</span>
          </button>
          <div className="lugemi-auth-divider"><span>or</span></div>
        </>
      )}

      {error && <div className="lugemi-auth-error-alert" role="alert">{error}</div>}

      {verifying ? (
        <div className="lugemi-auth-field">
          <label className="lugemi-auth-label" htmlFor="email-verification-code">Verification code</label>
          <div className="lugemi-auth-input-wrap">
            <input id="email-verification-code" type="text" inputMode="numeric" autoComplete="one-time-code" className="lugemi-auth-input" placeholder="Enter 6-digit code" value={code} onChange={(e) => setCode(e.target.value)} disabled={busy} required />
          </div>
          <p className="lugemi-auth-optional" style={{ marginTop: '0.25rem' }}>We sent a verification code to {email}.</p>
        </div>
      ) : (
        <>
          <div className="lugemi-auth-row">
            <div className="lugemi-auth-field">
              <div className="lugemi-auth-field-header">
                <label className="lugemi-auth-label" htmlFor="first-name">First name</label>
                <span className="lugemi-auth-optional">Optional</span>
              </div>
              <div className="lugemi-auth-input-wrap">
                <input id="first-name" type="text" autoComplete="given-name" className="lugemi-auth-input" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={busy} />
              </div>
            </div>
            <div className="lugemi-auth-field">
              <div className="lugemi-auth-field-header">
                <label className="lugemi-auth-label" htmlFor="last-name">Last name</label>
                <span className="lugemi-auth-optional">Optional</span>
              </div>
              <div className="lugemi-auth-input-wrap">
                <input id="last-name" type="text" autoComplete="family-name" className="lugemi-auth-input" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={busy} />
              </div>
            </div>
          </div>
          <div className="lugemi-auth-field">
            <label className="lugemi-auth-label" htmlFor="email">Email address</label>
            <div className="lugemi-auth-input-wrap">
              <input id="email" type="email" autoComplete="email" className="lugemi-auth-input" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} required />
            </div>
          </div>
          <div className="lugemi-auth-field">
            <div className="lugemi-auth-field-header">
              <label className="lugemi-auth-label" htmlFor="password">Password</label>
            </div>
            <div className="lugemi-auth-input-wrap">
              <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="lugemi-auth-input lugemi-auth-input-with-toggle" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} required />
              <button type="button" className="lugemi-auth-password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </>
      )}

      <button type="submit" className="lugemi-auth-submit-btn" disabled={!isLoaded || busy}>
        <span>{busy ? 'Workingâ¦' : verifying ? 'Verify email' : 'Continue'}</span>
      </button>

      <div className="lugemi-auth-sub-action">
        <span>Already have an account? </span>
        <Link href="/sign-in">Sign in</Link>
      </div>
    </form>
  );
}

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand-mark';
import './auth-shell.css';

type AuthShellProps = {
  mode: 'sign-up' | 'sign-in';
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Lugemi-first chrome around Clerk credential widgets.
 * Brand + copy own the first viewport; Clerk fields sit inside the product shell.
 */
export function AuthShell({ mode, children, footer }: AuthShellProps) {
  const isSignUp = mode === 'sign-up';

  return (
    <main className="auth-shell">
      <div className="auth-shell__glow" aria-hidden />
      <header className="auth-shell__top">
        <BrandMark href="/" size={36} />
        {isSignUp ? (
          <p className="auth-shell__switch">
            Already have an account?{' '}
            <Link href="/sign-in">Sign in</Link>
          </p>
        ) : (
          <p className="auth-shell__switch">
            New here?{' '}
            <Link href="/sign-up">Create account</Link>
          </p>
        )}
      </header>

      <div className="auth-shell__stage">
        <div className="auth-shell__intro">
          <p className="auth-shell__eyebrow">Lugemi</p>
          <h1 className="auth-shell__title">
            {isSignUp ? 'Start with Lugemi' : 'Welcome back'}
          </h1>
          <p className="auth-shell__lede">
            {isSignUp
              ? 'Create your account, then finish Lugemi setup — Creative or Agents, personalization, persona, and plan.'
              : 'Sign in to continue. New workspaces go through Lugemi onboarding before Creative or Agents.'}
          </p>
          {isSignUp ? (
            <ol className="auth-shell__steps" aria-label="Setup path">
              <li className="is-active">Account</li>
              <li>Platform</li>
              <li>Personalize</li>
              <li>Plan</li>
            </ol>
          ) : null}
        </div>

        <div className="auth-shell__panel">{children}</div>

        {footer ? <div className="auth-shell__footer">{footer}</div> : null}
      </div>
    </main>
  );
}

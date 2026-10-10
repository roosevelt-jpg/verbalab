import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand-mark';
import './auth-shell.css';

type AuthShellProps = {
  mode: 'sign-up' | 'sign-in';
  children: ReactNode;
  footer?: ReactNode;
  hasSocial?: boolean;
};

/**
 * Lugemi-first chrome around Clerk credential widgets.
 * Brand owns the first viewport; Clerk fields sit in a clean auth card.
 */
export function AuthShell({ mode, children, footer, hasSocial = true }: AuthShellProps) {
  const isSignUp = mode === 'sign-up';

  return (
    <main className={`auth-shell ${!hasSocial ? 'auth-shell--no-social' : ''}`}>
      <div className="auth-shell__glow" aria-hidden />
      <header className="auth-shell__top">
        <BrandMark href="/" size={36} />
        {isSignUp ? (
          <p className="auth-shell__switch">
            Already have an account? <Link href="/sign-in">Sign in</Link>
          </p>
        ) : (
          <p className="auth-shell__switch">
            New here? <Link href="/sign-up">Create account</Link>
          </p>
        )}
      </header>

      <div className="auth-shell__grid">
        <aside className="auth-shell__brand">
          <p className="auth-shell__brand-name">Lugemi</p>
          <h1 className="auth-shell__title">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="auth-shell__lede">
            {isSignUp
              ? (hasSocial
                  ? 'Email or Google, then finish Lugemi setup — Creative or Agents, personalization, persona, and plan — before your workspace opens.'
                  : 'Enter your name, email, and password to create your Lugemi account, then finish workspace setup.')
              : 'Sign in to continue. New workspaces go through Lugemi onboarding before Creative or Agents.'}
          </p>
          {isSignUp ? (
            <p className="auth-shell__tip">
              {hasSocial ? (
                <>Tip: Use 15+ characters for password signup, or choose <strong>Continue with Google</strong> for instant access.</>
              ) : (
                <>Tip: Use 15+ characters for password signup to meet enterprise security standards.</>
              )}
            </p>
          ) : null}
          {isSignUp ? (
            <ol className="auth-shell__steps" aria-label="Setup path">
              <li className="is-active">Account</li>
              <li>Platform</li>
              <li>Personalize</li>
              <li>Plan</li>
            </ol>
          ) : (
            <ul className="auth-shell__bullets">
              <li>LugemiCreative — speech, studio, and localization</li>
              <li>LugemiAgents — voice and chat agents</li>
              <li>Four plans — Free, Pro, Business, Enterprise</li>
            </ul>
          )}
        </aside>

        <div className="auth-shell__card-col">
          <div className="auth-shell__panel">{children}</div>
          {footer ? <div className="auth-shell__footer">{footer}</div> : null}
        </div>
      </div>
    </main>
  );
}

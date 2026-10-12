'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { useAuth } from './provider';

export function SignedIn({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return <>{children}</>;
}

export function SignOutButton({
  children,
  redirectUrl = '/',
}: {
  children?: ReactNode;
  redirectUrl?: string;
}) {
  const { signOut, isSignedIn } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!isSignedIn) return null;

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut();
      router.replace(redirectUrl);
    } finally {
      setBusy(false);
    }
  };

  if (children) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={() => void handle()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') void handle();
        }}
        style={{ display: 'contents', cursor: busy ? 'wait' : 'pointer' }}
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      className="vl-btn vl-btn-secondary"
      onClick={() => void handle()}
      disabled={busy}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

export function UserButton({ afterSignOutUrl = '/' }: { afterSignOutUrl?: string }) {
  const { isSignedIn, email, displayName } = useAuth();
  if (!isSignedIn) return null;

  const label = (displayName || email || 'Account').trim();
  const initial = label.charAt(0).toUpperCase() || 'U';

  return (
    <div className="lugemi-user-chip" title={email ?? label}>
      <Link href="/identity" className="lugemi-user-chip-avatar" aria-label="Account">
        {initial}
      </Link>
      <Link
        href={afterSignOutUrl === '/' ? '/identity' : '/identity'}
        className="lugemi-user-chip-menu"
        aria-label="Open account"
      >
        ···
      </Link>
    </div>
  );
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useClerk,
} from '@clerk/nextjs';
import { lugemiClerkAppearance, lugemiClerkLocalization } from '@/lib/clerk-appearance';
import { GUEST_AUTH, type AuthState } from './types';

const ClerkAuthContext = createContext<AuthState>(GUEST_AUTH);

function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const clerk = useClerkAuth();
  const { signOut: clerkSignOut } = useClerk();

  const getToken = useCallback(
    async (options?: { template?: string }) => {
      try {
        return (await clerk.getToken(options)) ?? null;
      } catch {
        return null;
      }
    },
    [clerk],
  );

  const signOut = useCallback(async () => {
    await clerkSignOut({ redirectUrl: '/' });
  }, [clerkSignOut]);

  const value = useMemo<AuthState>(
    () => ({
      isLoaded: clerk.isLoaded,
      isSignedIn: Boolean(clerk.isSignedIn),
      userId: clerk.userId ?? null,
      getToken,
      signOut,
      email: null,
      displayName: null,
    }),
    [clerk.isLoaded, clerk.isSignedIn, clerk.userId, getToken, signOut],
  );

  return (
    <ClerkAuthContext.Provider value={value}>{children}</ClerkAuthContext.Provider>
  );
}

export function ClerkAuthRoot({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={lugemiClerkAppearance}
      localization={lugemiClerkLocalization}
      afterSignOutUrl="/"
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}

export function useClerkAuthState(): AuthState {
  return useContext(ClerkAuthContext);
}

/** Wraps children with Clerk and exposes AuthState via onReady callback context — used by lazy AuthProvider. */
export function ClerkAuthTree({
  children,
  AuthContext,
}: {
  children: ReactNode;
  AuthContext: React.Context<AuthState | null>;
}) {
  return (
    <ClerkAuthRoot>
      <ClerkAuthTreeInner AuthContext={AuthContext}>{children}</ClerkAuthTreeInner>
    </ClerkAuthRoot>
  );
}

function ClerkAuthTreeInner({
  children,
  AuthContext,
}: {
  children: ReactNode;
  AuthContext: React.Context<AuthState | null>;
}) {
  const state = useClerkAuthState();
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

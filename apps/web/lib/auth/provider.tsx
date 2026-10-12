'use client';

import {
  createContext,
  lazy,
  Suspense,
  useContext,
  type ReactNode,
} from 'react';
import { authBackend } from './config';
import { FirebaseAuthProvider, useFirebaseAuthState } from './firebase-provider';
import { GUEST_AUTH, type AuthState } from './types';

const AuthContext = createContext<AuthState | null>(null);

const ClerkAuthTree = lazy(() =>
  import('./clerk-bridge').then((m) => ({
    default: function LazyClerk({ children }: { children: ReactNode }) {
      return <m.ClerkAuthTree AuthContext={AuthContext}>{children}</m.ClerkAuthTree>;
    },
  })),
);

function FirebaseAuthConsumer({ children }: { children: ReactNode }) {
  const state = useFirebaseAuthState();
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

/**
 * Root auth wrapper. Firebase wins when configured (Clerk loads only as a lazy chunk).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const backend = authBackend();
  if (backend === 'firebase') {
    return (
      <FirebaseAuthProvider>
        <FirebaseAuthConsumer>{children}</FirebaseAuthConsumer>
      </FirebaseAuthProvider>
    );
  }
  if (backend === 'clerk') {
    return (
      <Suspense fallback={null}>
        <ClerkAuthTree>{children}</ClerkAuthTree>
      </Suspense>
    );
  }
  return <AuthContext.Provider value={GUEST_AUTH}>{children}</AuthContext.Provider>;
}

/** Clerk-compatible session hook used across Studio clients. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  return ctx ?? GUEST_AUTH;
}

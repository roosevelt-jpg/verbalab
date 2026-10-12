'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { syncAuthSessionCookie, clearAuthSessionCookieClient } from './session-cookie';
import { GUEST_AUTH, type AuthState } from './types';

const FirebaseAuthContext = createContext<AuthState>(GUEST_AUTH);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setIsLoaded(true);
      void (async () => {
        if (next) {
          try {
            const token = await next.getIdToken();
            await syncAuthSessionCookie(token);
          } catch {
            await syncAuthSessionCookie(null);
          }
        } else {
          await syncAuthSessionCookie(null);
        }
      })();
    });
    return () => unsub();
  }, []);

  const getToken = useCallback(async () => {
    if (!user) return null;
    try {
      return await user.getIdToken(/* forceRefresh */ false);
    } catch {
      return null;
    }
  }, [user]);

  const signOut = useCallback(async () => {
    clearAuthSessionCookieClient();
    await syncAuthSessionCookie(null);
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      isLoaded,
      isSignedIn: Boolean(user),
      userId: user?.uid ?? null,
      getToken,
      signOut,
      email: user?.email ?? null,
      displayName: user?.displayName ?? null,
    }),
    [isLoaded, user, getToken, signOut],
  );

  return (
    <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuthState(): AuthState {
  return useContext(FirebaseAuthContext);
}

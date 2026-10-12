'use client';

import type { ReactNode } from 'react';
import { useAuth, isAuthConfigured } from '@/lib/auth';

export type CreativeAuth = {
  getToken: (options?: { template?: string }) => Promise<string | null>;
  isLoaded: boolean;
  isSignedIn?: boolean;
};

const GUEST: CreativeAuth = {
  getToken: async () => null,
  isLoaded: true,
  isSignedIn: false,
};

function Authed({ children }: { children: (auth: CreativeAuth) => ReactNode }) {
  const auth = useAuth();
  return <>{children(auth)}</>;
}

/** Render-prop gate so useAuth is never called without AuthProvider. */
export function CreativeAuthGate({ children }: { children: (auth: CreativeAuth) => ReactNode }) {
  if (!isAuthConfigured()) return <>{children(GUEST)}</>;
  return <Authed>{children}</Authed>;
}

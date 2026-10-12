'use client';

import { ReactNode, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { resolveWorkspaceBearer } from '@/lib/studio-api-key';

export type VoiceBridgeAuth = {
  getToken: () => Promise<string | null>;
  isSignedIn: boolean;
  /** True after Clerk finishes loading, or immediately when Clerk is not configured. */
  isLoaded: boolean;
  /**
   * Resolve a Bearer for VoiceBridge API calls (Studio machine key preferred,
   * then Clerk session JWT, then an optional override paste field).
   */
  resolveBearer: (overrideKey?: string) => Promise<string | null>;
};

function ClerkAuthBridge({ children }: { children: (auth: VoiceBridgeAuth) => ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const resolveBearer = useCallback(
    async (overrideKey?: string) => resolveWorkspaceBearer(() => getToken(), overrideKey),
    [getToken],
  );

  return (
    <>
      {children({
        isLoaded,
        isSignedIn: Boolean(isSignedIn),
        getToken,
        resolveBearer,
      })}
    </>
  );
}

/** Renders children with auth; never calls useAuth unless ClerkProvider is mounted. */
export function VoiceBridgeAuthGate({ children }: { children: (auth: VoiceBridgeAuth) => ReactNode }) {
  if (!isClerkConfigured()) {
    return (
      <>
        {children({
          isLoaded: true,
          isSignedIn: false,
          getToken: async () => null,
          resolveBearer: async (overrideKey?: string) =>
            resolveWorkspaceBearer(undefined, overrideKey),
        })}
      </>
    );
  }
  return <ClerkAuthBridge>{children}</ClerkAuthBridge>;
}

export function isMachineApiKey(token: string | null | undefined): boolean {
  if (!token) return false;
  return token.startsWith('lg_') || token.startsWith('vl_');
}

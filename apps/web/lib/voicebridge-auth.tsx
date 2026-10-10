'use client';

import { ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';

export type VoiceBridgeAuth = {
  getToken: () => Promise<string | null>;
  isSignedIn: boolean;
  clerkReady: boolean;
};

function ClerkAuthBridge({ children }: { children: (auth: VoiceBridgeAuth) => ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  return (
    <>
      {children({
        clerkReady: true,
        isSignedIn: Boolean(isSignedIn),
        getToken,
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
          clerkReady: false,
          isSignedIn: false,
          getToken: async () => null,
        })}
      </>
    );
  }
  return <ClerkAuthBridge>{children}</ClerkAuthBridge>;
}

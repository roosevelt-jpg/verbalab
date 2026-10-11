'use client';

import { ReactNode, useCallback, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';

export type RelayAuthBag = {
  signedIn: boolean;
  apiKey: string;
  setApiKey: (v: string) => void;
  actorId: string;
  setActorId: (v: string) => void;
  authHeaders: () => Promise<{ token: string; actor?: string }>;
  ready: boolean;
};

function RelayAuthAuthed({ children }: { children: (auth: RelayAuthBag) => ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('');
  const signedIn = Boolean(isSignedIn);

  const authHeaders = useCallback(async () => {
    if (signedIn) {
      const token = await getToken();
      if (!token) throw new Error('Missing session token');
      return { token, actor: undefined as string | undefined };
    }
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    return { token: apiKey, actor: actorId.trim() || 'relay-local' };
  }, [apiKey, actorId, getToken, signedIn]);

  return (
    <>
      {children({
        signedIn,
        apiKey,
        setApiKey,
        actorId,
        setActorId,
        authHeaders,
        ready: signedIn || apiKey.startsWith('lg_'),
      })}
    </>
  );
}

export function RelayAuthGate({ children }: { children: (auth: RelayAuthBag) => ReactNode }) {
  if (!isClerkConfigured()) {
    return <RelayAuthApiKeyOnly>{children}</RelayAuthApiKeyOnly>;
  }
  return <RelayAuthAuthed>{children}</RelayAuthAuthed>;
}

function RelayAuthApiKeyOnly({ children }: { children: (auth: RelayAuthBag) => ReactNode }) {
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('');

  const authHeaders = useCallback(async () => {
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    return { token: apiKey, actor: actorId.trim() || 'relay-local' };
  }, [apiKey, actorId]);

  return (
    <>
      {children({
        signedIn: false,
        apiKey,
        setApiKey,
        actorId,
        setActorId,
        authHeaders,
        ready: apiKey.startsWith('lg_'),
      })}
    </>
  );
}

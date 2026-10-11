'use client';

import { ReactNode, useCallback, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useStudioApiKeyField } from '@/hooks/use-studio-api-key';

export type EverydayAuthBag = {
  signedIn: boolean;
  apiKey: string;
  setApiKey: (v: string) => void;
  actorId: string;
  setActorId: (v: string) => void;
  authHeaders: () => Promise<{ token: string; actor?: string }>;
  ready: boolean;
};

function EverydayAuthAuthed({
  children,
}: {
  children: (auth: EverydayAuthBag) => ReactNode;
}) {
  const { getToken, isSignedIn } = useAuth();
  const { apiKey, setApiKey } = useStudioApiKeyField();
  const [actorId, setActorId] = useState('everyday-local');
  const signedIn = Boolean(isSignedIn);

  const authHeaders = useCallback(async () => {
    if (signedIn) {
      const token = await getToken();
      if (!token) throw new Error('Missing session token');
      return { token, actor: undefined as string | undefined };
    }
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    return { token: apiKey, actor: actorId };
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

/** Never call useAuth unless ClerkProvider is mounted. */
export function EverydayAuthGate({
  children,
}: {
  children: (auth: EverydayAuthBag) => ReactNode;
}) {
  if (!isClerkConfigured()) {
    return <EverydayAuthApiKeyOnly>{children}</EverydayAuthApiKeyOnly>;
  }
  return <EverydayAuthAuthed>{children}</EverydayAuthAuthed>;
}

function EverydayAuthApiKeyOnly({
  children,
}: {
  children: (auth: EverydayAuthBag) => ReactNode;
}) {
  const { apiKey, setApiKey } = useStudioApiKeyField();
  const [actorId, setActorId] = useState('everyday-local');

  const authHeaders = useCallback(async () => {
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    return { token: apiKey, actor: actorId };
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

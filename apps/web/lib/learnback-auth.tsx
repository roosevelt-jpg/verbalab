'use client';

import { ReactNode, useCallback, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useStudioApiKeyField } from '@/hooks/use-studio-api-key';

export type LearnBackAuthBag = {
  signedIn: boolean;
  apiKey: string;
  setApiKey: (v: string) => void;
  actorId: string;
  setActorId: (v: string) => void;
  authHeaders: () => Promise<{ token: string; actor?: string }>;
  ready: boolean;
};

function LearnBackAuthAuthed({
  children,
}: {
  children: (auth: LearnBackAuthBag) => ReactNode;
}) {
  const { getToken, isSignedIn } = useAuth();
  const { apiKey, setApiKey } = useStudioApiKeyField();
  const [actorId, setActorId] = useState('');
  const signedIn = Boolean(isSignedIn);

  const authHeaders = useCallback(async () => {
    if (signedIn) {
      const token = await getToken();
      if (!token) throw new Error('Missing session token');
      return { token, actor: undefined as string | undefined };
    }
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    const actor = actorId.trim() || 'learnback-local';
    return { token: apiKey, actor };
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
export function LearnBackAuthGate({
  children,
}: {
  children: (auth: LearnBackAuthBag) => ReactNode;
}) {
  if (!isClerkConfigured()) {
    return <LearnBackAuthApiKeyOnly>{children}</LearnBackAuthApiKeyOnly>;
  }
  return <LearnBackAuthAuthed>{children}</LearnBackAuthAuthed>;
}

function LearnBackAuthApiKeyOnly({
  children,
}: {
  children: (auth: LearnBackAuthBag) => ReactNode;
}) {
  const { apiKey, setApiKey } = useStudioApiKeyField();
  const [actorId, setActorId] = useState('');

  const authHeaders = useCallback(async () => {
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    const actor = actorId.trim() || 'learnback-local';
    return { token: apiKey, actor };
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

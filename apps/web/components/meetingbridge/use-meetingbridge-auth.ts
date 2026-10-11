'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useStudioApiKeyField } from '@/hooks/use-studio-api-key';

export function useMeetingBridgeAuth() {
  const { getToken, isSignedIn, userId } = useAuth();
  const { apiKey, setApiKey } = useStudioApiKeyField();
  const [actorId, setActorId] = useState('organizer-local');
  const signedIn = Boolean(isClerkConfigured() && isSignedIn);

  const authHeaders = useCallback(async () => {
    if (signedIn) {
      const token = await getToken();
      if (!token) throw new Error('Missing session token');
      return { token, actor: undefined as string | undefined };
    }
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    return { token: apiKey, actor: actorId };
  }, [apiKey, actorId, getToken, signedIn]);

  return {
    signedIn,
    userId,
    apiKey,
    setApiKey,
    actorId,
    setActorId,
    authHeaders,
    ready: signedIn || apiKey.startsWith('lg_'),
  };
}

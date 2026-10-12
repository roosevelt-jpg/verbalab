import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

export type FirebaseIdTokenClaims = {
  uid: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
};

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseIdTokenClaims> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
  }

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  return claimsFromPayload(payload);
}

function claimsFromPayload(payload: JWTPayload): FirebaseIdTokenClaims {
  const uid = typeof payload.sub === 'string' ? payload.sub : '';
  if (!uid) throw new Error('Firebase token missing subject');
  return {
    uid,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    emailVerified: payload.email_verified === true,
  };
}

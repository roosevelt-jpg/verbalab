import { NextResponse, type NextRequest } from 'next/server';
import { LUGEMI_SESSION_COOKIE, isFirebaseConfigured } from '@/lib/auth/config';
import { verifyFirebaseIdToken } from '@/lib/auth/verify-firebase-id-token';

const MAX_AGE_SEC = 60 * 60 * 24 * 5; // 5 days — refreshed on each client auth tick

export async function POST(request: NextRequest) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'firebase_not_configured' }, { status: 503 });
  }

  let idToken: string | undefined;
  try {
    const body = (await request.json()) as { idToken?: string };
    idToken = body.idToken?.trim();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  if (!idToken) {
    return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
  }

  try {
    const claims = await verifyFirebaseIdToken(idToken);
    const res = NextResponse.json({ ok: true, uid: claims.uid });
    res.cookies.set({
      name: LUGEMI_SESSION_COOKIE,
      value: idToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: MAX_AGE_SEC,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: LUGEMI_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}

import { NextResponse } from 'next/server';

/**
 * Local/dev helper: mint a Clerk sign-in ticket for the seeded reviewer user.
 * Only works with sk_test_ secrets — never enables itself for live keys.
 */
export async function POST {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim;
  if (!secretKey?.startsWith('sk_test_')) {
    return NextResponse.json(
      { error: 'dev_login_disabled', message: 'Dev login requires a Clerk test secret (sk_test_).' },
      { status: 403 },
    );
  }

  const email = process.env.E2E_CLERK_USER_EMAIL?.trim || 'local.reviewer@example.com';

  const listRes = await fetch(
    `https://api.clerk.com/v1/users?limit=5&email_address=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  );
  if (!listRes.ok) {
    return NextResponse.json(
      { error: 'user_lookup_failed', status: listRes.status },
      { status: 502 },
    );
  }
  const users = (await listRes.json) as Array<{ id: string }>;
  const userId = users[0]?.id;
  if (!userId) {
    return NextResponse.json(
      {
        error: 'user_missing',
        message: `No Clerk user for ${email}. Create one via Backend API first.`,
      },
      { status: 404 },
    );
  }

  const tokenRes = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 60 * 30 }),
    cache: 'no-store',
  });
  const tokenBody = (await tokenRes.json) as { token?: string; url?: string; errors?: unknown };
  if (!tokenRes.ok || !tokenBody.token) {
    return NextResponse.json(
      { error: 'ticket_mint_failed', detail: tokenBody },
      { status: 502 },
    );
  }

  return NextResponse.json({
    email,
    ticket: tokenBody.token,
    clerkHostedUrl: tokenBody.url ?? null,
  });
}

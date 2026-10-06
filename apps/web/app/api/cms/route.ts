import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getCmsDocument, isCmsAdminAllowed, saveCmsDocument } from '@/lib/cms';
import type { CmsDocument } from '@/data/cms-types';
import { isClerkConfigured } from '@/lib/clerk-config';

export const dynamic = 'force-dynamic';

export async function GET {
  const doc = await getCmsDocument;
  return NextResponse.json(doc);
}

async function assertCmsAdmin: Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (!isClerkConfigured) {
    if (isCmsAdminAllowed({ email: null, userId: null })) return { ok: true };
    return {
      ok: false,
      response: NextResponse.json({ error: { message: 'CMS admin unavailable' } }, { status: 403 }),
    };
  }

  const session = await auth;
  if (!session.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 }),
    };
  }
  const user = await currentUser;
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;
  if (!isCmsAdminAllowed({ email, userId: session.userId })) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { message: 'Platform admin access required' } },
        { status: 403 },
      ),
    };
  }
  return { ok: true };
}

export async function PUT(request: Request) {
  const gate = await assertCmsAdmin;
  if (!gate.ok) return gate.response;

  let body: CmsDocument;
  try {
    body = (await request.json) as CmsDocument;
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || !Array.isArray(body.pages)) {
    return NextResponse.json(
      { error: { message: 'Invalid CMS document: expected pages array' } },
      { status: 400 },
    );
  }

  const saved = await saveCmsDocument(body);
  return NextResponse.json(saved);
}

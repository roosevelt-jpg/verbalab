import { auth, currentUser } from '@clerk/nextjs/server';
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getCmsDocument, isCmsAdminAllowed, saveCmsDocument } from '@/lib/cms';
import { isClerkConfigured } from '@/lib/clerk-config';

export const dynamic = 'force-dynamic';

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

export async function POST(request: Request) {
  const gate = await assertCmsAdmin;
  if (!gate.ok) return gate.response;

  const form = await request.formData;
  const file = form.get('file');
  const label = String(form.get('label') ?? 'Upload');
  const alt = String(form.get('alt') ?? '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: { message: 'file required' } }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const stamp = Date.now;
  const filename = `${stamp}-${safeName}`;
  const dir = path.join(process.cwd, 'public', 'cms-media');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);

  const url = `/cms-media/${filename}`;
  const kind = file.type.startsWith('video/') ? 'video' : 'image';
  const doc = await getCmsDocument;
  doc.mediaLibrary = [
    { id: `media-${stamp}`, label, kind, url, alt: alt || undefined },
    ...doc.mediaLibrary,
  ];
  await saveCmsDocument(doc);

  return NextResponse.json({ url, kind, label, alt: alt || null });
}

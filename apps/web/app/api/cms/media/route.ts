import { auth, currentUser } from '@clerk/nextjs/server';
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getCmsDocument, isCmsAdminAllowed, saveCmsDocument } from '@/lib/cms';
import { isClerkConfigured } from '@/lib/clerk-config';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 40 * 1024 * 1024;
const ALLOWED_PREFIXES = ['image/', 'video/'] as const;

async function assertCmsAdmin(): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (!isClerkConfigured()) {
    if (isCmsAdminAllowed({ email: null, userId: null })) return { ok: true };
    return {
      ok: false,
      response: NextResponse.json({ error: { message: 'CMS admin unavailable' } }, { status: 403 }),
    };
  }
  const session = await auth();
  if (!session.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 }),
    };
  }
  const user = await currentUser();
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
  const gate = await assertCmsAdmin();
  if (!gate.ok) return gate.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: { message: 'Invalid multipart form' } }, { status: 400 });
  }

  const file = form.get('file');
  const label = String(form.get('label') ?? 'Upload').slice(0, 120);
  const alt = String(form.get('alt') ?? '').slice(0, 240);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: { message: 'file required' } }, { status: 400 });
  }
  if (!file.size) {
    return NextResponse.json({ error: { message: 'Empty file' } }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: { message: `File must be under ${MAX_BYTES / (1024 * 1024)} MB` } },
      { status: 413 },
    );
  }

  const mime = file.type || '';
  if (!ALLOWED_PREFIXES.some((p) => mime.startsWith(p))) {
    return NextResponse.json(
      { error: { message: 'Only image/* and video/* uploads are allowed' } },
      { status: 415 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'upload.bin';
  const stamp = Date.now();
  const filename = `${stamp}-${safeName}`;
  const dir = path.join(process.cwd(), 'public', 'cms-media');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);

  const url = `/cms-media/${filename}`;
  const kind = mime.startsWith('video/') ? 'video' : 'image';
  const doc = await getCmsDocument();
  doc.mediaLibrary = [
    { id: `media-${stamp}`, label, kind, url, alt: alt || undefined },
    ...(doc.mediaLibrary ?? []),
  ];
  await saveCmsDocument(doc);

  return NextResponse.json({ url, kind, label, alt: alt || null });
}

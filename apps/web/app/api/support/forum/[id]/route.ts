import { NextResponse } from 'next/server';
import {
  FORUM_CATEGORY_LABELS,
  getForumThread,
  replyForumThread,
} from '@/lib/support-store';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const thread = await getForumThread(id);
  if (!thread) {
    return NextResponse.json({ error: { message: 'Thread not found' } }, { status: 404 });
  }
  return NextResponse.json({
    thread: {
      ...thread,
      categoryLabel: FORUM_CATEGORY_LABELS[thread.category],
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: { author?: string; body?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) {
    return NextResponse.json({ error: { message: 'body required' } }, { status: 400 });
  }

  const thread = await replyForumThread({
    threadId: id,
    author: typeof body.author === 'string' ? body.author : 'Community',
    body: text,
  });
  if (!thread) {
    return NextResponse.json({ error: { message: 'Thread not found' } }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    thread: {
      ...thread,
      categoryLabel: FORUM_CATEGORY_LABELS[thread.category],
    },
  });
}

import { NextResponse } from 'next/server';
import {
  FORUM_CATEGORY_LABELS,
  createForumThread,
  isForumCategory,
  listForumThreads,
} from '@/lib/support-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const threads = await listForumThreads(category);
  return NextResponse.json({
    categories: FORUM_CATEGORY_LABELS,
    threads: threads.map((t) => ({
      id: t.id,
      title: t.title,
      body: t.body,
      author: t.author,
      category: t.category,
      categoryLabel: FORUM_CATEGORY_LABELS[t.category],
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      replyCount: t.replies.length,
      excerpt: t.body.slice(0, 180),
    })),
  });
}

export async function POST(request: Request) {
  let body: {
    title?: string;
    body?: string;
    author?: string;
    category?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  if (!title || !text) {
    return NextResponse.json({ error: { message: 'title and body required' } }, { status: 400 });
  }
  if (!isForumCategory(category)) {
    return NextResponse.json(
      { error: { message: 'category must be api-integration, billing, speech, ideas, or troubleshooting' } },
      { status: 400 },
    );
  }

  const thread = await createForumThread({
    title,
    body: text,
    author: typeof body.author === 'string' ? body.author : 'Community',
    category,
  });

  return NextResponse.json({ ok: true, thread }, { status: 201 });
}

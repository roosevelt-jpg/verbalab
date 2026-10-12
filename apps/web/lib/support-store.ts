import { appendFile, mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  FORUM_CATEGORY_LABELS,
  isForumCategory,
  type ForumCategory,
} from '@/lib/support-types';

export type { ForumCategory } from '@/lib/support-types';
export { FORUM_CATEGORY_LABELS, isForumCategory } from '@/lib/support-types';

export type SupportTicket = {
  id: string;
  createdAt: string;
  email: string | null;
  orgId: string | null;
  message: string;
  subject?: string | null;
  category?: string | null;
  history?: Array<{ role: string; content: string }>;
  reason: string;
  source: 'support_chat' | 'support_page' | 'support_escalate';
  status: 'open' | 'queued';
};

export type ForumReply = {
  id: string;
  createdAt: string;
  author: string;
  body: string;
};

export type ForumThread = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  body: string;
  author: string;
  category: ForumCategory;
  replies: ForumReply[];
};

function dataDir() {
  return join(process.cwd(), '.data', 'support');
}

function ticketsPath() {
  return join(dataDir(), 'escalations.jsonl');
}

function forumPath() {
  return join(dataDir(), 'forum.json');
}

export function newSupportId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function fileSupportTicket(input: {
  message: string;
  email?: string | null;
  orgId?: string | null;
  subject?: string | null;
  category?: string | null;
  history?: Array<{ role: string; content: string }>;
  reason: string;
  source: SupportTicket['source'];
}): Promise<SupportTicket> {
  const ticket: SupportTicket = {
    id: newSupportId('sup'),
    createdAt: new Date().toISOString(),
    email: input.email?.trim() || null,
    orgId: input.orgId?.trim() || null,
    message: input.message.trim(),
    subject: input.subject?.trim() || null,
    category: input.category?.trim() || null,
    history: (input.history ?? []).slice(-12),
    reason: input.reason,
    source: input.source,
    status: 'queued',
  };
  await mkdir(dataDir(), { recursive: true });
  await appendFile(ticketsPath(), `${JSON.stringify(ticket)}\n`, 'utf8');
  return ticket;
}

const SEED_THREADS: ForumThread[] = [
  {
    id: 'frm_seed_401',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    title: '401 Unauthorized on /v1/translate after pasting a key',
    body: 'I created an lg_test_ key under API keys and applied it in Studio, but Playground still returns 401. What headers does Lugemi expect besides Authorization?',
    author: 'Ada · Accra',
    category: 'api-integration',
    replies: [
      {
        id: 'frm_seed_401_r1',
        createdAt: '2026-10-01T11:15:00.000Z',
        author: 'Lugemi staff',
        body: 'Use Authorization: Bearer lg_test_… (or lg_live_). If the call is workspace-scoped, also send X-Lugemi-Workspace-Id from the console header switcher. After Create & apply under /keys, Playground should pick up the Studio machine key automatically — hard-refresh if the chip still says none.',
      },
    ],
  },
  {
    id: 'frm_seed_429',
    createdAt: '2026-10-02T08:30:00.000Z',
    updatedAt: '2026-10-02T09:00:00.000Z',
    title: 'Hitting 429 during batch document jobs',
    body: 'Document translate jobs start fine, then later polls return 429. Is there a recommended backoff for /v1/jobs/:id?',
    author: 'Kwame · Kumasi',
    category: 'troubleshooting',
    replies: [
      {
        id: 'frm_seed_429_r1',
        createdAt: '2026-10-02T09:00:00.000Z',
        author: 'Community',
        body: 'Exponential backoff with jitter worked for us — start at 1s, cap around 30s. Also check /usage; Free plan throttles harder than Pro. Webhooks avoid tight polling when you can.',
      },
    ],
  },
  {
    id: 'frm_seed_sw',
    createdAt: '2026-10-03T14:00:00.000Z',
    updatedAt: '2026-10-03T14:00:00.000Z',
    title: 'Kiswahili TTS sounding like English with an accent',
    body: 'When I pick a Nairobi Kiswahili voice in Explore, I still hear English copy. Is that expected?',
    author: 'Aisha · Nairobi',
    category: 'speech',
    replies: [
      {
        id: 'frm_seed_sw_r1',
        createdAt: '2026-10-03T14:20:00.000Z',
        author: 'Lugemi staff',
        body: 'No — selecting a Kiswahili voice should load a Kiswahili script. If you still see English, refresh and use Preview voice; pass language=sw-KE (or the voice’s BCP-47) with own:sw-ke-female on /v1/tts/synthesize.',
      },
    ],
  },
  {
    id: 'frm_seed_idea',
    createdAt: '2026-10-04T16:00:00.000Z',
    updatedAt: '2026-10-04T16:00:00.000Z',
    title: 'Idea: OpenAPI examples per African corridor',
    body: 'Would love copy-paste OpenAPI snippets for en→ak, en→sw, and en→yo with the matching Echo voice ids.',
    author: 'Builders desk',
    category: 'ideas',
    replies: [],
  },
];

async function ensureForum(): Promise<ForumThread[]> {
  await mkdir(dataDir(), { recursive: true });
  try {
    const raw = await readFile(forumPath(), 'utf8');
    const parsed = JSON.parse(raw) as { threads?: ForumThread[] };
    if (Array.isArray(parsed.threads) && parsed.threads.length > 0) return parsed.threads;
  } catch {
    // seed on first read
  }
  await writeFile(forumPath(), JSON.stringify({ threads: SEED_THREADS }, null, 2), 'utf8');
  return SEED_THREADS;
}

async function saveForum(threads: ForumThread[]) {
  await mkdir(dataDir(), { recursive: true });
  await writeFile(forumPath(), JSON.stringify({ threads }, null, 2), 'utf8');
}

export async function listForumThreads(category?: string | null): Promise<ForumThread[]> {
  const threads = await ensureForum();
  const filtered =
    category && isForumCategory(category)
      ? threads.filter((t) => t.category === category)
      : threads;
  return filtered
    .map((t) => ({ ...t, replies: t.replies ?? [] }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getForumThread(id: string): Promise<ForumThread | null> {
  const threads = await ensureForum();
  return threads.find((t) => t.id === id) ?? null;
}

export async function createForumThread(input: {
  title: string;
  body: string;
  author: string;
  category: ForumCategory;
}): Promise<ForumThread> {
  const threads = await ensureForum();
  const now = new Date().toISOString();
  const thread: ForumThread = {
    id: newSupportId('frm'),
    createdAt: now,
    updatedAt: now,
    title: input.title.trim().slice(0, 160),
    body: input.body.trim().slice(0, 4000),
    author: input.author.trim().slice(0, 80) || 'Community',
    category: input.category,
    replies: [],
  };
  threads.unshift(thread);
  await saveForum(threads.slice(0, 500));
  return thread;
}

export async function replyForumThread(input: {
  threadId: string;
  author: string;
  body: string;
}): Promise<ForumThread | null> {
  const threads = await ensureForum();
  const idx = threads.findIndex((t) => t.id === input.threadId);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const reply: ForumReply = {
    id: newSupportId('frr'),
    createdAt: now,
    author: input.author.trim().slice(0, 80) || 'Community',
    body: input.body.trim().slice(0, 4000),
  };
  const thread = { ...threads[idx]!, replies: [...(threads[idx]!.replies ?? []), reply], updatedAt: now };
  threads[idx] = thread;
  await saveForum(threads);
  return thread;
}

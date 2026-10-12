'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { FORUM_CATEGORY_LABELS, type ForumCategory } from '@/lib/support-types';

type ForumRow = {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  category: ForumCategory;
  categoryLabel: string;
  replyCount: number;
  updatedAt: string;
};

type ForumThreadDetail = {
  id: string;
  title: string;
  body: string;
  author: string;
  category: ForumCategory;
  categoryLabel: string;
  createdAt: string;
  replies: Array<{ id: string; author: string; body: string; createdAt: string }>;
};

const CATEGORIES = Object.entries(FORUM_CATEGORY_LABELS) as Array<[ForumCategory, string]>;

function openLiveChat() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lugemi:open-support-chat'));
  }
}

export function SupportClient() {
  const [tab, setTab] = useState<'message' | 'forum' | 'escalate'>('message');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('api-integration');
  const [message, setMessage] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [forumFilter, setForumFilter] = useState<string>('');
  const [threads, setThreads] = useState<ForumRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<ForumThreadDetail | null>(null);
  const [forumError, setForumError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState<ForumCategory>('api-integration');
  const [replyBody, setReplyBody] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash === 'forum') setTab('forum');
    if (hash === 'escalate' || hash === 'human') setTab('escalate');
    const params = new URLSearchParams(window.location.search);
    if (params.get('escalate') === '1' || params.get('chat') === '1') {
      setTab('escalate');
      if (params.get('chat') === '1') openLiveChat();
    }
  }, []);

  const loadForum = useCallback(async () => {
    setForumError(null);
    try {
      const q = forumFilter ? `?category=${encodeURIComponent(forumFilter)}` : '';
      const res = await fetch(`/api/support/forum${q}`);
      const body = (await res.json()) as { threads?: ForumRow[]; error?: { message?: string } };
      if (!res.ok) throw new Error(body.error?.message ?? 'Could not load forum');
      setThreads(body.threads ?? []);
    } catch (err) {
      setForumError(err instanceof Error ? err.message : 'Forum load failed');
    }
  }, [forumFilter]);

  useEffect(() => {
    if (tab === 'forum') void loadForum();
  }, [tab, loadForum]);

  async function openThread(id: string) {
    setActiveId(id);
    setForumError(null);
    try {
      const res = await fetch(`/api/support/forum/${id}`);
      const body = (await res.json()) as {
        thread?: ForumThreadDetail;
        error?: { message?: string };
      };
      if (!res.ok || !body.thread) throw new Error(body.error?.message ?? 'Thread not found');
      setActive(body.thread);
    } catch (err) {
      setForumError(err instanceof Error ? err.message : 'Could not open thread');
      setActive(null);
    }
  }

  async function onSendMessage(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setTicketId(null);
    try {
      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, category, message }),
      });
      const body = (await res.json()) as {
        ticketId?: string;
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(body.error?.message ?? 'Send failed');
      setTicketId(body.ticketId ?? null);
      setMessage('');
      setSubject('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  }

  async function onCreateThread(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setForumError(null);
    try {
      const res = await fetch('/api/support/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          body: newBody,
          author: newAuthor || 'Community',
          category: newCategory,
        }),
      });
      const body = (await res.json()) as {
        thread?: { id: string };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(body.error?.message ?? 'Could not post');
      setNewTitle('');
      setNewBody('');
      await loadForum();
      if (body.thread?.id) void openThread(body.thread.id);
    } catch (err) {
      setForumError(err instanceof Error ? err.message : 'Could not post');
    } finally {
      setBusy(false);
    }
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!activeId) return;
    setBusy(true);
    setForumError(null);
    try {
      const res = await fetch(`/api/support/forum/${activeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: replyBody,
          author: replyAuthor || 'Community',
        }),
      });
      const body = (await res.json()) as {
        thread?: ForumThreadDetail;
        error?: { message?: string };
      };
      if (!res.ok || !body.thread) throw new Error(body.error?.message ?? 'Reply failed');
      setActive(body.thread);
      setReplyBody('');
      await loadForum();
    } catch (err) {
      setForumError(err instanceof Error ? err.message : 'Reply failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <p className="vl-tag" style={{ margin: 0 }}>
        Support
      </p>
      <h1
        style={{
          margin: '0.45rem 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          letterSpacing: '-0.03em',
          color: 'var(--brand-navy)',
        }}
      >
        Get help. Talk to humans. Share with builders.
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.65rem 0 0', maxWidth: '42rem', lineHeight: 1.6 }}>
        Send a message that files a tracked ticket, escalate from the live chat bot to a person, or join the
        community forum for API integration tips and common issues.
      </p>

      <div className="vl-player-bar" style={{ marginTop: '1.35rem' }}>
        {(
          [
            ['message', 'Send a message'],
            ['forum', 'Community forum'],
            ['escalate', 'Human escalation'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`vl-mode-tab${tab === id ? ' is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'message' ? (
        <section className="vl-panel" style={{ marginTop: '1.15rem', padding: '1.35rem', display: 'grid', gap: '0.85rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Message Lugemi Support</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
            Every message creates a ticket id. For refunds, security, Enterprise, or anything the bot cannot finish,
            humans pick up from that queue.
          </p>
          <form onSubmit={onSendMessage} style={{ display: 'grid', gap: '0.75rem', maxWidth: '36rem' }}>
            <label className="vl-label">
              Email
              <input
                className="vl-field"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </label>
            <label className="vl-label">
              Subject
              <input
                className="vl-field"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="API key not metering usage"
              />
            </label>
            <label className="vl-label">
              Category
              <select className="vl-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
                <option value="enterprise">Enterprise / SSO</option>
                <option value="security">Security</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="vl-label">
              Message
              <textarea
                className="vl-field"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What are you trying to do? Include request ids or error codes when you have them."
              />
            </label>
            {formError ? (
              <p style={{ color: 'var(--bad)', margin: 0 }} role="alert">
                {formError}
              </p>
            ) : null}
            {ticketId ? (
              <p style={{ margin: 0, color: 'var(--muted)' }} role="status">
                Ticket <strong>{ticketId}</strong> queued. We will reply to {email}.
              </p>
            ) : null}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
                {busy ? 'Sending…' : 'Send message'}
              </button>
              <button type="button" className="vl-btn" onClick={openLiveChat}>
                Open live chat
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === 'escalate' ? (
        <section className="vl-panel" style={{ marginTop: '1.15rem', padding: '1.35rem', display: 'grid', gap: '0.9rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>How bot → human escalation works</h2>
          <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--ink)', lineHeight: 1.65 }}>
            <li>
              Open the floating <strong>Support</strong> chat (bottom-right on every page) or use{' '}
              <button type="button" className="vl-btn" style={{ marginLeft: 4 }} onClick={openLiveChat}>
                Open live chat
              </button>
            </li>
            <li>
              Ask normally — the bot answers self-serve paths (API keys, billing, catalogs) or auto-files a ticket for
              refunds, security, Enterprise, and unmatched topics.
            </li>
            <li>
              Say <strong>talk to a human</strong> (or tap that suggestion). Confirm with an optional email — that
              queues ticket <code className="vl-code">sup_…</code> for staff follow-up.
            </li>
            <li>
              Prefer email from the start? Use <strong>Send a message</strong> on this page — same ticket queue, no
              chat required.
            </li>
          </ol>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
            Tickets are stored for the support queue and referenced in the chat reply. Community discussion stays in the
            forum — it does not replace a tracked human ticket.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <button type="button" className="vl-btn vl-btn-primary" onClick={openLiveChat}>
              Escalate in live chat
            </button>
            <button type="button" className="vl-btn" onClick={() => setTab('message')}>
              Email a human instead
            </button>
            <Link href="/docs" className="vl-btn" style={{ textDecoration: 'none' }}>
              Docs
            </Link>
            <Link href="/keys" className="vl-btn" style={{ textDecoration: 'none' }}>
              API keys
            </Link>
          </div>
        </section>
      ) : null}

      {tab === 'forum' ? (
        <section style={{ marginTop: '1.15rem', display: 'grid', gap: '1rem' }} id="forum">
          <div className="vl-panel" style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Community forum</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
              Share integration issues, workarounds, and product ideas. Not a substitute for private tickets — use Send
              a message for secrets, billing, or account data.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              <button
                type="button"
                className={`vl-mode-tab${!forumFilter ? ' is-active' : ''}`}
                onClick={() => setForumFilter('')}
              >
                All
              </button>
              {CATEGORIES.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`vl-mode-tab${forumFilter === id ? ' is-active' : ''}`}
                  onClick={() => setForumFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {forumError ? (
              <p style={{ color: 'var(--bad)', margin: 0 }} role="alert">
                {forumError}
              </p>
            ) : null}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.65rem' }}>
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => void openThread(t.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: '0.85rem 1rem',
                      background: activeId === t.id ? 'var(--bg-soft)' : '#fff',
                      cursor: 'pointer',
                      font: 'inherit',
                    }}
                  >
                    <div style={{ fontWeight: 650, color: 'var(--brand-navy)' }}>{t.title}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
                      {t.categoryLabel} · {t.author} · {t.replyCount}{' '}
                      {t.replyCount === 1 ? 'reply' : 'replies'}
                    </div>
                    <p style={{ margin: '0.45rem 0 0', fontSize: '0.9rem', lineHeight: 1.45 }}>{t.excerpt}</p>
                  </button>
                </li>
              ))}
              {!threads.length ? (
                <li style={{ color: 'var(--muted)' }}>No threads in this category yet — start one below.</li>
              ) : null}
            </ul>
          </div>

          {active ? (
            <div className="vl-panel" style={{ padding: '1.25rem', display: 'grid', gap: '0.85rem' }}>
              <div>
                <p className="vl-tag" style={{ margin: 0 }}>
                  {active.categoryLabel}
                </p>
                <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.2rem' }}>{active.title}</h3>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {active.author} · {new Date(active.createdAt).toLocaleString()}
                </p>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{active.body}</p>
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {active.replies.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      borderLeft: '3px solid var(--line)',
                      paddingLeft: '0.85rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.author}</div>
                    <p style={{ margin: '0.25rem 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{r.body}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={onReply} style={{ display: 'grid', gap: '0.55rem', maxWidth: '36rem' }}>
                <label className="vl-label">
                  Display name
                  <input
                    className="vl-field"
                    value={replyAuthor}
                    onChange={(e) => setReplyAuthor(e.target.value)}
                    placeholder="Your name or handle"
                  />
                </label>
                <label className="vl-label">
                  Reply
                  <textarea
                    className="vl-field"
                    required
                    rows={3}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Share what worked for you…"
                  />
                </label>
                <button type="submit" className="vl-btn vl-btn-primary" disabled={busy} style={{ width: 'fit-content' }}>
                  {busy ? 'Posting…' : 'Post reply'}
                </button>
              </form>
            </div>
          ) : null}

          <div className="vl-panel" style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Start a thread</h3>
            <form onSubmit={onCreateThread} style={{ display: 'grid', gap: '0.65rem', maxWidth: '36rem' }}>
              <label className="vl-label">
                Title
                <input
                  className="vl-field"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="CORS errors calling translate from the browser"
                />
              </label>
              <label className="vl-label">
                Category
                <select
                  className="vl-field"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ForumCategory)}
                >
                  {CATEGORIES.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="vl-label">
                Display name
                <input
                  className="vl-field"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Your name or handle"
                />
              </label>
              <label className="vl-label">
                Details
                <textarea
                  className="vl-field"
                  required
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="What you tried, error codes, and the endpoint path — no secrets."
                />
              </label>
              <button type="submit" className="vl-btn vl-btn-primary" disabled={busy} style={{ width: 'fit-content' }}>
                {busy ? 'Posting…' : 'Post thread'}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

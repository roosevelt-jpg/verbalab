'use client';

import { useEffect, useRef, useState } from 'react';
import './support-chat.css';

type ChatMsg = { role: 'user' | 'assistant'; content: string; escalate?: boolean };

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content:
        'Hi — I am Lugemi Support. Ask about API keys, billing plans, quotas, speech, or translate. Say “escalate to human” for complex account issues.',
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setBusy(true);
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(({ role, content }) => ({ role, content })),
        }),
      });
      const body = (await res.json()) as {
        reply?: string;
        escalate?: boolean;
        ticketHint?: string | null;
        error?: { message: string };
      };
      if (!res.ok) throw new Error(body.error?.message ?? `Support error (${res.status})`);
      const parts = [body.reply ?? '…'];
      if (body.escalate && body.ticketHint) parts.push(body.ticketHint);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: parts.join('\n\n'), escalate: body.escalate },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Support chat failed',
          escalate: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lg-support">
      {open ? (
        <div className="lg-support-panel" role="dialog" aria-label="Lugemi support chat">
          <header className="lg-support-head">
            <div>
              <strong>Lugemi Support</strong>
              <p>Self-serve first · escalate when needed</p>
            </div>
            <button type="button" className="lg-support-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </header>
          <div className="lg-support-messages">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={m.role === 'user' ? 'lg-support-bubble lg-support-user' : 'lg-support-bubble lg-support-bot'}
              >
                {m.content}
                {m.escalate ? <span className="lg-support-escalated">Human escalation</span> : null}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form
            className="lg-support-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about API, billing, speech…"
              aria-label="Support message"
            />
            <button type="submit" disabled={busy || !input.trim()}>
              {busy ? '…' : 'Send'}
            </button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        className="lg-support-fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Open support chat"
      >
        <span aria-hidden="true">💬</span>
        Chat for support
      </button>
    </div>
  );
}

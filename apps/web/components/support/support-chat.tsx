'use client';

import { useEffect, useRef, useState } from 'react';
import './support-chat.css';

type ChatMsg = {
  role: 'user' | 'assistant';
  content: string;
  escalate?: boolean;
};

const SUGGESTIONS = [
  'How do I create an API key?',
  'Explain billing plans',
  'Language catalog count',
  'Native catalog every country',
  'Talk to a human',
];

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content:
        'Hi — I am Lugemi Support. Every message is closed 100%: either concrete self-serve steps, or an auto-filed ticket with an id (refunds, security, Enterprise, or anything I cannot finish in-chat). Ask about API keys, catalogs (213 languages / 206 countries), billing, speech, or translate.',
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, showEscalateForm]);

  async function sendMessage(text: string, opts?: { escalateOnly?: boolean }) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    if (!opts?.escalateOnly) {
      setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    }
    setBusy(true);
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map(({ role, content }) => ({ role, content })),
          email: email.trim() || undefined,
          escalateOnly: opts?.escalateOnly ?? false,
        }),
      });
      const body = (await res.json()) as {
        reply?: string;
        escalate?: boolean;
        resolved?: boolean;
        resolution?: string;
        ticketHint?: string | null;
        ticketId?: string | null;
        suggestions?: string[];
        error?: { message: string };
      };
      if (!res.ok) throw new Error(body.error?.message ?? `Support error (${res.status})`);
      const parts = [body.reply ?? '…'];
      if (body.ticketHint) parts.push(body.ticketHint);
      if (body.resolved && body.resolution) {
        parts.push(
          body.resolution === 'ticket'
            ? 'Closure: 100% — tracked ticket filed.'
            : 'Closure: 100% — self-serve steps above.',
        );
      }
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: parts.join('\n\n'), escalate: body.escalate },
      ]);
      // Ticket already auto-filed for complex cases; only show email form for explicit human request.
      if (opts?.escalateOnly) setShowEscalateForm(false);
      else if (body.escalate && !body.ticketId) setShowEscalateForm(true);
      else setShowEscalateForm(false);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Support chat failed',
          escalate: true,
        },
      ]);
      setShowEscalateForm(true);
    } finally {
      setBusy(false);
    }
  }

  function send() {
    void sendMessage(input);
  }

  function fileEscalation() {
    const summary =
      input.trim() ||
      messages
        .filter((m) => m.role === 'user')
        .slice(-3)
        .map((m) => m.content)
        .join(' | ') ||
      'User requested human escalation from Lugemi Support chat';
    void sendMessage(summary, { escalateOnly: true });
  }

  return (
    <div className="lg-support">
      {open ? (
        <div className="lg-support-panel" role="dialog" aria-label="Lugemi support chat">
          <header className="lg-support-head">
            <div>
              <strong>Lugemi Support</strong>
              <p>100% closure · fix or tracked ticket every turn</p>
            </div>
            <button type="button" className="lg-support-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </header>
          <div className="lg-support-messages">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={
                  m.role === 'user' ? 'lg-support-bubble lg-support-user' : 'lg-support-bubble lg-support-bot'
                }
              >
                {m.content}
                {m.escalate ? <span className="lg-support-escalated">Human escalation</span> : null}
              </div>
            ))}
            <div className="lg-support-chips" aria-label="Suggested questions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="lg-support-chip"
                  disabled={busy}
                  onClick={() => {
                    void sendMessage(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {showEscalateForm ? (
              <div className="lg-support-escalate-box">
                <label className="lg-support-escalate-label">
                  Email for follow-up (optional)
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </label>
                <button type="button" className="lg-support-escalate-btn" disabled={busy} onClick={fileEscalation}>
                  {busy ? 'Filing…' : 'Confirm human escalation'}
                </button>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
          <form
            className="lg-support-form"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about API, billing, quotas…"
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
        aria-label="Open Lugemi support chat"
      >
        Support
      </button>
    </div>
  );
}

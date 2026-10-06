'use client';

import { FormEvent, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Language = { code: string; name: string };
type ChatTurn = { role: 'user' | 'assistant'; content: string };

type ChatCompletion = {
  choices: Array<{ message: { role: string; content: string } }>;
  translated?: boolean;
  translateReplyTo?: string | null;
  provider?: string;
  model?: string;
};

export function ChatClient() {
  const { getToken, isLoaded } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [translateReplyTo, setTranslateReplyTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void apiFetch<{ data: Language[] }>('/v1/languages')
      .then((res) => setLanguages(res.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setLoading(true);
    const nextMessages: ChatTurn[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');

    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<ChatCompletion>('/v1/chat/completions', {
        method: 'POST',
        token,
        body: JSON.stringify({
          messages: nextMessages,
          ...(translateReplyTo ? { translateReplyTo } : {}),
        }),
      });
      const reply = res.choices?.[0]?.message?.content ?? '';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <AppShell>
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>Chat</h1>
      <p style={ledeStyle}>Language-intelligence assistant. Optional: translate the reply into another language.</p>

      <div className="vl-panel" style={{ marginTop: '1.5rem', padding: '1.25rem', display: 'grid', gap: '1rem', minHeight: '28rem' }}>
        <div style={{ display: 'grid', gap: '0.85rem', flex: 1, maxHeight: '22rem', overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              Ask about glossaries, localization, or how to translate a phrase.
            </p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                style={{
                  justifySelf: msg.role === 'user' ? 'end' : 'start',
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: 14,
                  background: msg.role === 'user' ? 'var(--ink)' : 'var(--bg-soft)',
                  color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.55,
                }}
              >
                {msg.content}
              </div>
            ))
          )}
          {loading ? <p style={{ color: 'var(--muted)', margin: 0 }}>Thinking…</p> : null}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
          <label className="vl-label">
            Translate reply to (optional)
            <select
              className="vl-field"
              value={translateReplyTo}
              onChange={(e) => setTranslateReplyTo(e.target.value)}
            >
              <option value="">No translation</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
            <input
              className="vl-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Lugemi…"
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading} className="vl-btn vl-btn-primary">
              {loading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
    </AppShell>
  );
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  letterSpacing: '-0.03em',
  fontSize: '2rem',
};

const ledeStyle: CSSProperties = { color: 'var(--muted)', margin: '0.5rem 0 0' };

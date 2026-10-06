'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { playDemoSpeech, stopDemoSpeech } from '@/lib/demo-speech';
import {
  getSpeechRecognitionCtor,
  recognitionLangFor,
  speechRecognitionSupported,
  type SpeechRecognitionLike,
} from '@/lib/speech-recognition';
import {
  PLATFORM_CONNECTORS,
  connectedFlags,
  loadInstalls,
  saveInstalls,
  type ConnectorCategory,
  type ConnectorInstall,
} from '@/lib/connectors-catalog';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';

type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  kind?: 'chat' | 'live' | 'upload' | 'system';
  fileName?: string;
  sourceLang?: string;
  targetLang?: string;
  playing?: boolean;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatTurn[];
};

type ChatCompletion = {
  choices: Array<{ message: { role: string; content: string } }>;
  translated?: boolean;
  translateReplyTo?: string | null;
};

const STORAGE_KEY = 'lugemi_chat_studio_v1';

const PLUGIN_CATEGORIES: ConnectorCategory[] = [
  'voice',
  'video',
  'chat',
  'office',
  'storage',
  'email',
];

const SUGGESTIONS = [
  'Translate this greeting into Twi and play it back',
  'How do I upload a PDF for document translation?',
  'Explain Africa-first language coverage for speaking agents',
  'Draft a polite Yorùbá support reply about shipping delays',
];

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(rows: Conversation[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 40)));
}

function isTextLike(file: File) {
  const n = file.name.toLowerCase();
  return (
    file.type.startsWith('text/') ||
    n.endsWith('.txt') ||
    n.endsWith('.md') ||
    n.endsWith('.csv') ||
    n.endsWith('.json') ||
    n.endsWith('.srt') ||
    n.endsWith('.vtt')
  );
}

function isAudioLike(file: File) {
  const n = file.name.toLowerCase();
  return (
    file.type.startsWith('audio/') ||
    n.endsWith('.mp3') ||
    n.endsWith('.wav') ||
    n.endsWith('.m4a') ||
    n.endsWith('.ogg') ||
    n.endsWith('.webm') ||
    n.endsWith('.flac')
  );
}

function isVideoLike(file: File) {
  const n = file.name.toLowerCase();
  return (
    file.type.startsWith('video/') ||
    n.endsWith('.mp4') ||
    n.endsWith('.mov') ||
    n.endsWith('.mkv') ||
    n.endsWith('.webm')
  );
}

function isDocumentLike(file: File) {
  const n = file.name.toLowerCase();
  return (
    n.endsWith('.pdf') ||
    n.endsWith('.docx') ||
    file.type === 'application/pdf' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

function titleFromText(text: string) {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > 42 ? `${t.slice(0, 42)}…` : t || 'New chat';
}

function IconPaperclip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 7.5 8.2 13.8a3.2 3.2 0 1 0 4.5 4.5l7.1-7.1a4.8 4.8 0 1 0-6.8-6.8L5.3 12.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMic({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3.5" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5M9 20.5h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSend({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.2 12 19 5.5 14.2 18.5l-1.6-5.2L5.2 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3.75 12h16.5M12 3.75c2.4 2.5 3.6 5.3 3.6 8.25S14.4 17.75 12 20.25c-2.4-2.5-3.6-5.3-3.6-8.25S9.6 6.25 12 3.75Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function ChatClient() {
  const { getToken, isLoaded } = useAuth();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const liveFinalRef = useRef('');
  const activeIdRef = useRef<string | null>(null);
  const wantRecordingRef = useRef(false);
  const segmentQueueRef = useRef<string[]>([]);
  const translatingSegmentRef = useRef(false);
  const liveTargetRef = useRef('ak');

  const catalog = useLocaleCatalog();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [translateReplyTo, setTranslateReplyTo] = useState('ak');
  const [liveTarget, setLiveTarget] = useState('ak');
  const [uploadSource, setUploadSource] = useState('auto');
  const [uploadTarget, setUploadTarget] = useState('ak');
  const [mode, setMode] = useState<'chat' | 'live'>('chat');
  const [pluginsOpen, setPluginsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const langPopoverRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const [livePreview, setLivePreview] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [servingFrom, setServingFrom] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<{ features: Array<{ feature: string; models: Array<{ slug: string; hostedResidency?: string | null; servingFrom?: string | null }> }> }>('/v1/models/live')
      .then((matrix) => {
        const chat = matrix.features.find((f) => f.feature === 'chat');
        const atlas = chat?.models.find((m) => m.slug === 'lugemi-atlas-reason');
        setServingFrom(atlas?.servingFrom ?? atlas?.hostedResidency ?? null);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    liveTargetRef.current = liveTarget;
  }, [liveTarget]);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const rows = loadConversations();
    setConversations(rows);
    setActiveId(rows[0]?.id ?? null);
    activeIdRef.current = rows[0]?.id ?? null;
    setConnected(connectedFlags(loadInstalls()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveConversations(conversations);
  }, [conversations, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, conversations, loading, interim, recording]);

  useEffect(() => {
    return () => {
      wantRecordingRef.current = false;
      recognitionRef.current?.abort();
      stopDemoSpeech();
    };
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    function onPointerDown(event: MouseEvent) {
      const el = langPopoverRef.current;
      if (el && !el.contains(event.target as Node)) setLangOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setLangOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [langOpen]);

  const ensureConversation = useCallback((): string => {
    if (activeIdRef.current) return activeIdRef.current;
    const id = uid();
    const fresh: Conversation = {
      id,
      title: 'New chat',
      updatedAt: Date.now(),
      messages: [],
    };
    activeIdRef.current = id;
    setActiveId(id);
    setConversations((prev) => [fresh, ...prev]);
    return id;
  }, []);

  const updateConversation = useCallback((id: string, updater: (prev: Conversation) => Conversation) => {
    setConversations((prev) => {
      const list = [...prev];
      const idx = list.findIndex((c) => c.id === id);
      if (idx < 0) return prev;
      list[idx] = updater(list[idx]!);
      return list;
    });
  }, []);

  function startNewChat() {
    const fresh: Conversation = {
      id: uid(),
      title: 'New chat',
      updatedAt: Date.now(),
      messages: [],
    };
    activeIdRef.current = fresh.id;
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setInput('');
    setError(null);
    setInterim('');
  }

  async function ensureToken() {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    return token;
  }

  async function translateText(token: string, text: string, source: string, target: string) {
    try {
      const res = await apiFetch<{ text: string; source: string; characters: number }>(
        '/v1/translate',
        {
          method: 'POST',
          token,
          body: JSON.stringify({ text, source, target }),
        },
      );
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // Soft-sandbox: when live translate providers are unset, use curated demo translate.
      if (!/not set|not configured|provider/i.test(msg)) throw err;
      const demoRes = await fetch('/api/demo/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          source: source === 'auto' ? 'en' : source,
          target,
        }),
      });
      const demo = (await demoRes.json()) as {
        translated?: string;
        source?: string;
        target?: string;
        error?: { message?: string };
        mode?: string;
      };
      if (!demoRes.ok || !demo.translated) {
        throw new Error(demo.error?.message ?? (msg || 'Translate failed'));
      }
      return {
        text: demo.translated,
        source: demo.source ?? (source === 'auto' ? 'en' : source),
        characters: [...text].length,
      };
    }
  }

  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [loadingMsgId, setLoadingMsgId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const playbackGen = useRef(0);

  async function playTranslation(text: string, lang: string, msgId = 'auto') {
    const token = ++playbackGen.current;
    stopDemoSpeech();
    setPlaybackError(null);
    setPlayingMsgId(msgId);
    setLoadingMsgId(msgId);
    try {
      await playDemoSpeech({
        text,
        lang,
        voiceId: lang.startsWith('sw') ? 'amara' : 'abe',
        onStarted: () => {
          if (token !== playbackGen.current) return;
          setLoadingMsgId(null);
        },
      });
    } catch (err) {
      if (token !== playbackGen.current) return;
      setPlaybackError(err instanceof Error ? err.message : 'Playback failed');
    } finally {
      if (token === playbackGen.current) {
        setPlayingMsgId(null);
        setLoadingMsgId(null);
      }
    }
  }

  function stopTranslationPlayback() {
    playbackGen.current += 1;
    stopDemoSpeech();
    setPlayingMsgId(null);
    setLoadingMsgId(null);
  }

  async function sendChat(text: string) {
    setError(null);
    setLoading(true);
    const convId = ensureConversation();
    const userTurn: ChatTurn = { id: uid(), role: 'user', content: text, kind: 'chat' };
    const prior = conversations.find((c) => c.id === convId)?.messages ?? [];

    updateConversation(convId, (conv) => ({
      ...conv,
      title: conv.messages.length === 0 ? titleFromText(text) : conv.title,
      updatedAt: Date.now(),
      messages: [...conv.messages, userTurn],
    }));
    setInput('');

    try {
      const token = await ensureToken();
      const history = [...prior, userTurn].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await apiFetch<ChatCompletion>('/v1/chat/completions', {
        method: 'POST',
        token,
        body: JSON.stringify({
          messages: history,
          ...(translateReplyTo ? { translateReplyTo } : {}),
        }),
      });
      const reply = res.choices?.[0]?.message?.content ?? '';
      updateConversation(convId, (conv) => ({
        ...conv,
        updatedAt: Date.now(),
        messages: [
          ...conv.messages,
          {
            id: uid(),
            role: 'assistant',
            content: reply,
            kind: 'chat',
            targetLang: translateReplyTo || undefined,
          },
        ],
      }));
      if (translateReplyTo && reply) {
        void playTranslation(reply, recognitionLangFor(translateReplyTo));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
      updateConversation(convId, (conv) => ({
        ...conv,
        messages: conv.messages.filter((m) => m.id !== userTurn.id),
      }));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading || recording) return;
    if (mode === 'live') {
      await runLiveTranslate(text);
      return;
    }
    await sendChat(text);
  }

  async function runLiveTranslate(spoken: string) {
    const text = spoken.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    setInput('');
    setInterim('');

    const convId = ensureConversation();
    const userTurn: ChatTurn = {
      id: uid(),
      role: 'user',
      content: text,
      kind: 'live',
      sourceLang: 'auto',
      targetLang: liveTarget,
    };
    updateConversation(convId, (conv) => ({
      ...conv,
      title: conv.messages.length === 0 ? titleFromText(text) : conv.title,
      updatedAt: Date.now(),
      messages: [...conv.messages, userTurn],
    }));

    try {
      const token = await ensureToken();
      const res = await translateText(token, text, 'auto', liveTarget);
      const assistant: ChatTurn = {
        id: uid(),
        role: 'assistant',
        content: res.text,
        kind: 'live',
        sourceLang: res.source,
        targetLang: liveTarget,
      };
      updateConversation(convId, (conv) => ({
        ...conv,
        updatedAt: Date.now(),
        messages: [...conv.messages, assistant],
      }));
      await playTranslation(res.text, recognitionLangFor(liveTarget));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Live translate failed');
    } finally {
      setLoading(false);
    }
  }

  function stopRecording() {
    wantRecordingRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);
  }

  function enqueueLiveSegment(spoken: string) {
    const text = spoken.trim();
    if (!text) return;
    segmentQueueRef.current.push(text);
    void drainLiveSegmentQueue();
  }

  async function drainLiveSegmentQueue() {
    if (translatingSegmentRef.current) return;
    translatingSegmentRef.current = true;
    try {
      while (segmentQueueRef.current.length > 0) {
        const text = segmentQueueRef.current.shift()!;
        await translateFinalSegment(text);
      }
    } finally {
      translatingSegmentRef.current = false;
      if (segmentQueueRef.current.length > 0) {
        void drainLiveSegmentQueue();
      }
    }
  }

  async function translateFinalSegment(spoken: string) {
    const text = spoken.trim();
    if (!text) return;
    const target = liveTargetRef.current;
    const convId = ensureConversation();
    const userTurn: ChatTurn = {
      id: uid(),
      role: 'user',
      content: text,
      kind: 'live',
      sourceLang: 'auto',
      targetLang: target,
    };
    updateConversation(convId, (conv) => ({
      ...conv,
      title: conv.messages.length === 0 ? titleFromText(text) : conv.title,
      updatedAt: Date.now(),
      messages: [...conv.messages, userTurn],
    }));
    try {
      const token = await ensureToken();
      const res = await translateText(token, text, 'auto', target);
      setLivePreview(res.text);
      updateConversation(convId, (conv) => ({
        ...conv,
        updatedAt: Date.now(),
        messages: [
          ...conv.messages,
          {
            id: uid(),
            role: 'assistant',
            content: res.text,
            kind: 'live',
            sourceLang: res.source,
            targetLang: target,
          },
        ],
      }));
      void playTranslation(res.text, recognitionLangFor(target));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Live translate failed');
    }
  }

  function startRecognitionSession() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser. Type instead, or upload audio.');
      wantRecordingRef.current = false;
      setRecording(false);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = recognitionLangFor('en');
    recognition.onresult = (event) => {
      let interimBuf = '';
      let newlyFinal = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i]![0].transcript;
        if (event.results[i]!.isFinal) newlyFinal += `${piece} `;
        else interimBuf += piece;
      }
      if (newlyFinal.trim()) {
        liveFinalRef.current = '';
        setInterim('');
        setInput('');
        // Translate each FINAL segment immediately while recording continues.
        enqueueLiveSegment(newlyFinal);
      } else {
        setInterim(interimBuf);
        setInput(interimBuf.trim());
      }
    };
    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech') {
        // Keep continuous session alive; browser may end and we restart in onend.
        return;
      }
      setError(`Microphone error: ${event.error}`);
      wantRecordingRef.current = false;
      setRecording(false);
    };
    recognition.onend = () => {
      if (!wantRecordingRef.current) {
        setRecording(false);
        return;
      }
      // Web Speech often ends after a pause even with continuous=true — restart for live translate.
      window.setTimeout(() => {
        if (!wantRecordingRef.current) return;
        try {
          recognition.start();
          setRecording(true);
        } catch {
          try {
            startRecognitionSession();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not keep microphone open');
            wantRecordingRef.current = false;
            setRecording(false);
          }
        }
      }, 120);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start microphone');
      wantRecordingRef.current = false;
      setRecording(false);
    }
  }

  function toggleRecord() {
    if (recording || wantRecordingRef.current) {
      stopRecording();
      const leftover = (liveFinalRef.current || interim).trim();
      liveFinalRef.current = '';
      setInterim('');
      setLivePreview('');
      if (leftover) enqueueLiveSegment(leftover);
      return;
    }

    if (!speechRecognitionSupported()) {
      setError('Speech recognition is not supported in this browser. Type instead, or upload audio.');
      return;
    }

    setError(null);
    setMode('live');
    setPluginsOpen(false);
    liveFinalRef.current = '';
    segmentQueueRef.current = [];
    setInterim('');
    setLivePreview('');
    ensureConversation();
    wantRecordingRef.current = true;
    startRecognitionSession();
  }

  async function transcribeFile(token: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/v1/speech/recognize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = (await res.json()) as { text?: string; error?: { message: string } };
    if (!res.ok) throw new Error(body.error?.message ?? `STT failed (${res.status})`);
    return (body.text ?? '').trim();
  }

  async function translateDocumentJob(token: string, file: File, source: string, target: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('source', source === 'auto' ? 'en' : source);
    form.append('target', target);
    const createRes = await fetch(`${API_URL}/v1/documents/translate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const created = (await createRes.json()) as {
      id?: string;
      status?: string;
      error?: { message: string };
      result?: { preview?: string; downloadPath?: string };
    };
    if (!createRes.ok) {
      throw new Error(created.error?.message ?? `Document upload failed (${createRes.status})`);
    }

    let current = created;
    for (let i = 0; i < 60; i++) {
      if (current.status === 'succeeded' || current.status === 'failed') break;
      await new Promise((r) => setTimeout(r, 400));
      current = await apiFetch<typeof created>(`/v1/jobs/${created.id}`, { token });
    }
    if (current.status === 'failed') {
      throw new Error('Document translation job failed');
    }
    return current;
  }

  async function onUploadFile(file: File | null) {
    if (!file || loading) return;
    setLoading(true);
    setError(null);

    const convId = ensureConversation();
    const userTurn: ChatTurn = {
      id: uid(),
      role: 'user',
      content: `Translate uploaded file: ${file.name}`,
      kind: 'upload',
      fileName: file.name,
      sourceLang: uploadSource,
      targetLang: uploadTarget,
    };
    updateConversation(convId, (conv) => ({
      ...conv,
      title: conv.messages.length === 0 ? `Upload · ${file.name}` : conv.title,
      updatedAt: Date.now(),
      messages: [...conv.messages, userTurn],
    }));

    try {
      const token = await ensureToken();
      let sourceText = '';
      let note = '';

      if (isTextLike(file)) {
        sourceText = (await file.text()).slice(0, 12000);
        note = 'Text file';
      } else if (isAudioLike(file) || isVideoLike(file)) {
        sourceText = await transcribeFile(token, file);
        note = isVideoLike(file) ? 'Video → speech recognition' : 'Voice → speech recognition';
        if (!sourceText) throw new Error('No speech detected in the upload');
      } else if (isDocumentLike(file)) {
        const job = await translateDocumentJob(token, file, uploadSource, uploadTarget);
        const preview = job.result?.preview?.trim() || 'Document translated.';
        const download = job.result?.downloadPath
          ? `\n\nDownload: ${API_URL}${job.result.downloadPath}`
          : '';
        updateConversation(convId, (conv) => ({
          ...conv,
          updatedAt: Date.now(),
          messages: [
            ...conv.messages,
            {
              id: uid(),
              role: 'assistant',
              content: `${preview}${download}`,
              kind: 'upload',
              fileName: file.name,
              sourceLang: uploadSource,
              targetLang: uploadTarget,
            },
          ],
        }));
        if (job.result?.preview) {
          await playTranslation(job.result.preview.slice(0, 400), recognitionLangFor(uploadTarget));
        }
        return;
      } else {
        throw new Error('Unsupported file. Upload text, PDF/DOCX, audio, or video.');
      }

      const translated = await translateText(
        token,
        sourceText,
        uploadSource === 'auto' ? 'auto' : uploadSource,
        uploadTarget,
      );

      updateConversation(convId, (conv) => ({
        ...conv,
        updatedAt: Date.now(),
        messages: [
          ...conv.messages,
          {
            id: uid(),
            role: 'assistant',
            content: `${note}\n\nSource (${translated.source}):\n${sourceText.slice(0, 1500)}${
              sourceText.length > 1500 ? '…' : ''
            }\n\nTranslation (${uploadTarget}):\n${translated.text}`,
            kind: 'upload',
            fileName: file.name,
            sourceLang: translated.source,
            targetLang: uploadTarget,
          },
        ],
      }));
      await playTranslation(translated.text.slice(0, 500), recognitionLangFor(uploadTarget));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload translate failed');
      updateConversation(convId, (conv) => ({
        ...conv,
        messages: [
          ...conv.messages,
          {
            id: uid(),
            role: 'assistant',
            content: err instanceof Error ? err.message : 'Upload translate failed',
            kind: 'system',
          },
        ],
      }));
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function toggleConnector(id: string) {
    setConnected((prev) => {
      const turningOn = !prev[id];
      const installs: Record<string, ConnectorInstall> = { ...loadInstalls() };
      installs[id] = turningOn
        ? { ...(installs[id] ?? {}), connected: true, connectedAt: Date.now() }
        : { ...(installs[id] ?? {}), connected: false, connectedAt: undefined };
      saveInstalls(installs);
      return connectedFlags(installs);
    });
  }

  if (!isLoaded || !hydrated) {
    return (
      <AppShell>
        <p style={{ color: 'var(--muted)' }}>Loading Chat Studio…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="lg-chat-studio">
        <aside
          className={`lg-chat-history${libraryOpen ? ' is-open' : ''}`}
          aria-label="Library"
        >
          <div className="lg-chat-history-brand">Lugemi</div>
          <button
            type="button"
            className="vl-btn vl-btn-primary lg-chat-new"
            onClick={() => {
              startNewChat();
              setLibraryOpen(false);
            }}
          >
            New chat
          </button>
          <nav className="lg-chat-side-nav" aria-label="Studio sections">
            <button type="button" className="lg-chat-side-link is-active">
              Library
            </button>
            <button
              type="button"
              className={`lg-chat-side-link${pluginsOpen ? ' is-active' : ''}`}
              onClick={() => {
                setPluginsOpen(true);
                setLangOpen(false);
                setLibraryOpen(false);
              }}
            >
              Plugins
            </button>
            <Link href="/connectors" className="lg-chat-side-link">
              Explore
            </Link>
          </nav>
          <p className="lg-chat-history-label">Recents</p>
          <ul className="lg-chat-history-list">
            {conversations.length === 0 ? (
              <li className="lg-chat-history-empty">No chats yet</li>
            ) : (
              conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`lg-chat-history-item${c.id === activeId ? ' is-active' : ''}`}
                    onClick={() => {
                      activeIdRef.current = c.id;
                      setActiveId(c.id);
                      setLibraryOpen(false);
                    }}
                  >
                    <span>{c.title}</span>
                    <time dateTime={new Date(c.updatedAt).toISOString()}>
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </time>
                  </button>
                </li>
              ))
            )}
          </ul>
          <button
            type="button"
            className="lg-chat-history-close"
            aria-label="Close library"
            onClick={() => setLibraryOpen(false)}
          >
            Close
          </button>
        </aside>
        {libraryOpen ? (
          <button
            type="button"
            className="lg-chat-library-backdrop"
            aria-label="Dismiss library"
            onClick={() => setLibraryOpen(false)}
          />
        ) : null}

        <section className="lg-chat-main" aria-label="Chat">
          <header className="lg-chat-toolbar">
            <div>
              <h1 style={titleStyle}>Chat Studio</h1>
              <p style={ledeStyle}>
                Lugemi Atlas · Baobab translate
                {servingFrom ? (
                  <span style={{ color: 'var(--brand-navy)' }}> · Serving from {servingFrom}</span>
                ) : null}
              </p>
            </div>
            <div className="lg-chat-toolbar-actions">
              <button
                type="button"
                className="vl-btn vl-btn-secondary lg-chat-library-toggle"
                aria-expanded={libraryOpen}
                onClick={() => setLibraryOpen((v) => !v)}
              >
                Library
              </button>
              <div className="lg-chat-mode" role="group" aria-label="Mode">
                <button
                  type="button"
                  className={mode === 'chat' ? 'is-active' : ''}
                  onClick={() => setMode('chat')}
                >
                  Chat
                </button>
                <button
                  type="button"
                  className={mode === 'live' ? 'is-active' : ''}
                  onClick={() => setMode('live')}
                >
                  Live translate
                </button>
              </div>
              <button
                type="button"
                className={`vl-btn vl-btn-secondary${pluginsOpen ? ' is-pressed' : ''}`}
                aria-expanded={pluginsOpen}
                onClick={() => setPluginsOpen((v) => !v)}
              >
                Plugins
              </button>
            </div>
          </header>

          <div className="lg-chat-thread">
            {messages.length === 0 ? (
              <div className="lg-chat-empty">
                <p className="lg-chat-empty-brand">Lugemi</p>
                <h2>What’s on your mind today?</h2>
                <p>
                  Mic for live Baobab translation, attach a document/video/voice file, or open Plugins
                  for office, storage, and email tools.
                </p>
                <div className="lg-chat-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="lg-chat-suggestion"
                      disabled={loading || recording}
                      onClick={() => {
                        setMode('chat');
                        setLangOpen(false);
                        void sendChat(s);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <article
                  key={msg.id}
                  className={`lg-chat-bubble lg-chat-bubble--${msg.role}${msg.kind ? ` lg-chat-bubble--${msg.kind}` : ''}`}
                >
                  <div className="lg-chat-bubble-meta">
                    <span>{msg.role === 'user' ? 'You' : 'Lugemi'}</span>
                    {msg.kind === 'live' ? <span className="lg-chat-pill">Live</span> : null}
                    {msg.kind === 'upload' ? <span className="lg-chat-pill">Upload</span> : null}
                    {msg.fileName ? <span className="lg-chat-pill">{msg.fileName}</span> : null}
                    {msg.targetLang ? (
                      <span className="lg-chat-pill">→ {msg.targetLang}</span>
                    ) : null}
                  </div>
                  <div className="lg-chat-bubble-body">{msg.content}</div>
                  {msg.role === 'assistant' && msg.kind === 'live' ? (
                    <div className="lg-chat-replay-row">
                      <DemoPlayStopButton
                        active={playingMsgId === msg.id}
                        loading={loadingMsgId === msg.id}
                        variant="chip"
                        label="Play translation"
                        stopLabel="Stop"
                        ariaLabel={
                          playingMsgId === msg.id || loadingMsgId === msg.id
                            ? 'Stop translation'
                            : 'Play translation'
                        }
                        onStop={stopTranslationPlayback}
                        onPlay={() =>
                          void playTranslation(
                            msg.content,
                            recognitionLangFor(msg.targetLang ?? 'en'),
                            msg.id,
                          )
                        }
                      />
                      {playbackError && playingMsgId === msg.id ? (
                        <span className="lg-chat-replay-error" role="alert">
                          {playbackError}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))
            )}
            {recording ? (
              <div className="lg-chat-live-banner" aria-live="polite">
                <p className="lg-chat-listening">
                  Listening… {interim || 'speak now — translations appear as you finish each phrase'}
                </p>
                {livePreview ? (
                  <p className="lg-chat-live-preview">
                    <span>Live → {liveTarget}</span>
                    {livePreview}
                  </p>
                ) : null}
              </div>
            ) : null}
            {loading && !recording ? <p className="lg-chat-listening">Working…</p> : null}
            <div ref={bottomRef} />
          </div>

          {error ? (
            <p className="lg-chat-error" role="alert">
              {error}
            </p>
          ) : null}

          <form className="lg-chat-composer" onSubmit={onSubmit}>
            <div className="lg-chat-lang-wrap" ref={langPopoverRef}>
              <button
                type="button"
                className="lg-chat-lang-trigger"
                aria-expanded={langOpen}
                aria-haspopup="dialog"
                onClick={() => setLangOpen((v) => !v)}
              >
                <IconGlobe />
                <span className="lg-chat-lang-code">
                  {mode === 'live'
                    ? liveTarget || 'lang'
                    : translateReplyTo || uploadTarget || 'lang'}
                </span>
              </button>
              {langOpen ? (
                <div className="lg-chat-lang-popover" role="dialog" aria-label="Language settings">
                  <p className="lg-chat-lang-popover-title">Languages</p>
                  {mode === 'chat' ? (
                    <label className="vl-label lg-chat-inline-label">
                      Translate reply
                      <LocaleSelect
                        className="vl-field"
                        value={translateReplyTo}
                        onChange={setTranslateReplyTo}
                        languages={catalog.languages}
                        locales={catalog.locales}
                        dialects={catalog.dialects}
                        accents={catalog.accents}
                        allowEmpty
                        emptyLabel="Off"
                      />
                    </label>
                  ) : (
                    <label className="vl-label lg-chat-inline-label">
                      Live target
                      <LocaleSelect
                        className="vl-field"
                        value={liveTarget}
                        onChange={setLiveTarget}
                        languages={catalog.languages}
                        locales={catalog.locales}
                        dialects={catalog.dialects}
                        accents={catalog.accents}
                      />
                    </label>
                  )}
                  <label className="vl-label lg-chat-inline-label">
                    Upload source
                    <LocaleSelect
                      className="vl-field"
                      value={uploadSource}
                      onChange={setUploadSource}
                      languages={catalog.languages}
                      locales={catalog.locales}
                      dialects={catalog.dialects}
                      accents={catalog.accents}
                      allowAuto
                    />
                  </label>
                  <label className="vl-label lg-chat-inline-label">
                    Upload target
                    <LocaleSelect
                      className="vl-field"
                      value={uploadTarget}
                      onChange={setUploadTarget}
                      languages={catalog.languages}
                      locales={catalog.locales}
                      dialects={catalog.dialects}
                      accents={catalog.accents}
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <div className="lg-chat-composer-box">
              <input
                ref={fileRef}
                id={fileInputId}
                type="file"
                className="lg-chat-file-input"
                accept=".txt,.md,.csv,.json,.srt,.vtt,.pdf,.docx,audio/*,video/*,.mp3,.wav,.m4a,.mp4,.mov,.webm"
                onChange={(e) => void onUploadFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                className="lg-chat-icon-btn"
                aria-label="Attach document, video, or voice"
                title="Attach document, video, or voice"
                disabled={loading}
                onClick={() => fileRef.current?.click()}
              >
                <IconPaperclip />
              </button>
              <textarea
                className="lg-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === 'live'
                    ? 'Speak or type — translation plays instantly…'
                    : 'Message Lugemi…'
                }
                rows={1}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void onSubmit(e as unknown as FormEvent);
                  }
                }}
              />
              <button
                type="button"
                className={`lg-chat-icon-btn lg-chat-mic${recording ? ' is-recording' : ''}`}
                aria-pressed={recording}
                aria-label={recording ? 'Stop recording and translate' : 'Click to record'}
                title={
                  speechRecognitionSupported()
                    ? recording
                      ? 'Stop & translate'
                      : 'Click to record'
                    : 'Speech recognition unavailable'
                }
                disabled={loading && !recording}
                onClick={toggleRecord}
              >
                <IconMic />
              </button>
              <button
                type="submit"
                className="lg-chat-send"
                aria-label={mode === 'live' ? 'Translate' : 'Send'}
                title={mode === 'live' ? 'Translate' : 'Send'}
                disabled={loading || !input.trim()}
              >
                <IconSend />
              </button>
            </div>
            <p className="lg-chat-composer-hint">
              Mic translates finished phrases in realtime · Attach docs, video, or voice · Plugins
              connect office tools · Enter to send · Shift+Enter for newline
            </p>
          </form>
        </section>

        {pluginsOpen ? (
          <button
            type="button"
            className="lg-chat-plugins-backdrop"
            aria-label="Dismiss plugins"
            onClick={() => setPluginsOpen(false)}
          />
        ) : null}

        <aside className={`lg-chat-plugins${pluginsOpen ? ' is-open' : ''}`} aria-label="Connectors and plugins">
          <div className="lg-chat-plugins-head">
            <h2>Plugins</h2>
            <p>
              Voice, video, office, and chat connectors — same installer as{' '}
              <Link href="/connectors">Workspace Connectors</Link>. Lugemi audio stays clean for
              voice/video sync.
            </p>
            <button
              type="button"
              className="lg-chat-plugins-close"
              aria-label="Close plugins"
              onClick={() => setPluginsOpen(false)}
            >
              ×
            </button>
          </div>
          <ul className="lg-chat-plugin-list">
            {PLUGIN_CATEGORIES.map((cat) => (
              <li key={cat} className="lg-chat-plugin-group">
                <h3 className="lg-chat-plugin-group-title">{cat}</h3>
                <ul className="lg-chat-plugin-list">
                  {PLATFORM_CONNECTORS.filter((c) => c.category === cat).map((c) => {
                    const on = Boolean(connected[c.id]);
                    return (
                      <li key={c.id} className="lg-chat-plugin">
                        <div>
                          <strong>{c.name}</strong>
                          <p>{c.blurb}</p>
                          <Link href={c.href ?? `/connectors#${c.id}`} className="lg-chat-plugin-link">
                            Open installer / docs
                          </Link>
                        </div>
                        <button
                          type="button"
                          className={`vl-btn ${on ? 'vl-btn-secondary' : 'vl-btn-primary'}`}
                          aria-pressed={on}
                          onClick={() => toggleConnector(c.id)}
                        >
                          {on ? 'Disconnect' : 'Connect'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  letterSpacing: '-0.03em',
  fontSize: '1.55rem',
};

const ledeStyle: CSSProperties = {
  color: 'var(--muted)',
  margin: '0.35rem 0 0',
  fontSize: '0.92rem',
  lineHeight: 1.45,
};

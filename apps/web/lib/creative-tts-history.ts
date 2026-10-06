/** LugemiCreative TTS history (client-local). */

export type TtsHistoryItem = {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  stability: number;
  similarity: number;
  createdAt: string;
  /** Object URL when generation succeeded this session. */
  audioUrl?: string;
};

const KEY = 'lugemi.creative.tts.history.v1';

export function loadTtsHistory(): TtsHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TtsHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 40) : [];
  } catch {
    return [];
  }
}

export function saveTtsHistory(items: TtsHistoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const slim = items.slice(0, 40).map(({ audioUrl: _a, ...rest }) => rest);
    window.localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {
    /* ignore */
  }
}

export function pushTtsHistory(item: TtsHistoryItem) {
  const next = [item, ...loadTtsHistory()].slice(0, 40);
  saveTtsHistory(next);
  return next;
}

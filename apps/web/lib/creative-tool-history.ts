/** Browser-local LugemiCreative tool history (isolate, STT, dubbing, etc.). */

export type CreativeHistoryItem = {
  id: string;
  name: string;
  kind: string;
  format?: string;
  durationLabel?: string;
  meta?: string;
  createdAt: string;
  /** Session-only object URL when available. */
  previewUrl?: string;
  extra?: Record<string, string>;
};

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function loadCreativeHistory(key: string): CreativeHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CreativeHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 60) : [];
  } catch {
    return [];
  }
}

export function saveCreativeHistory(key: string, items: CreativeHistoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const slim = items.slice(0, 60).map(({ previewUrl: _p, ...rest }) => rest);
    window.localStorage.setItem(key, JSON.stringify(slim));
  } catch {
    /* ignore quota */
  }
}

export function pushCreativeHistory(key: string, item: Omit<CreativeHistoryItem, 'id' | 'createdAt'> & { id?: string }) {
  const row: CreativeHistoryItem = {
    ...item,
    id: item.id ?? uid(key.replace(/[^a-z]/gi, '').slice(0, 8) || 'row'),
    createdAt: new Date().toISOString(),
  };
  const next = [row, ...loadCreativeHistory(key)].slice(0, 60);
  saveCreativeHistory(key, next);
  return next;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return '—';
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}m ${r.toString().padStart(2, '0')}s`;
}

export function relativeTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return new Date(t).toLocaleDateString();
}

export const HISTORY_KEYS = {
  isolator: 'lugemi.creative.isolator.history.v1',
  changer: 'lugemi.creative.changer.history.v1',
  stt: 'lugemi.creative.stt.history.v1',
  dubbing: 'lugemi.creative.dubbing.history.v1',
  audiobooks: 'lugemi.creative.audiobooks.bookshelf.v1',
  music: 'lugemi.creative.music.prompts.v1',
} as const;

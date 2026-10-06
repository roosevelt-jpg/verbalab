/**
 * Minimal SSML → speak plan for OpenAI/own/clone TTS (no native SSML).
 * Supported: speak root, break, prosody rate/pitch (text cues), phoneme (alias),
 * say-as characters, plain text. Full SSML / vendor SSML engines are out of scope.
 */

export type SpeakSegment = {
  kind: 'speak' | 'pause';
  text?: string;
  pauseMs?: number;
  rateHint?: string;
  pitchHint?: string;
};

export type SsmlCompileResult = {
  plainText: string;
  segments: SpeakSegment[];
  unsupportedTags: string[];
  note: string;
};

const SUPPORTED = new Set(['speak', 'break', 'prosody', 'phoneme', 'say-as', 'p', 's']);

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseBreakMs(attrs: string): number {
  const m = /time\s*=\s*["']([^"']+)["']/i.exec(attrs);
  if (!m) return 300;
  const raw = m[1]!.trim().toLowerCase();
  if (raw.endsWith('ms')) return Math.max(0, Number.parseFloat(raw) || 0);
  if (raw.endsWith('s')) return Math.max(0, (Number.parseFloat(raw) || 0) * 1000);
  return Math.max(0, Number.parseFloat(raw) || 0);
}

function attr(attrs: string, name: string): string | undefined {
  const m = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i').exec(attrs);
  return m?.[1];
}

/** Apply soft rate/pitch hints as punctuation only — never spoken stage directions. */
function applyProsodyHints(text: string, rate?: string, pitch?: string): string {
  let out = text.trim();
  if (!out) return out;
  const r = (rate ?? '').toLowerCase();
  if (r.includes('slow') || r.includes('x-slow') || r.includes('-')) {
    out = out.replace(/([.!?])\s*/g, '$1 ').replace(/,/g, ', ');
  }
  if (r.includes('fast') || r.includes('x-fast') || r.includes('+')) {
    out = out.replace(/\s+/g, ' ');
  }
  const p = (pitch ?? '').toLowerCase();
  if (p.includes('high') || p.includes('+') || p.includes('up')) {
    if (!/[!?]$/.test(out)) out = `${out}!`;
  }
  if (p.includes('low') || p.includes('-') || p.includes('down')) {
    if (!/[.!?]$/.test(out)) out = `${out}.`;
  }
  return out;
}

export function compileSsmlLite(input: string): SsmlCompileResult {
  const raw = input?.trim() ?? '';
  if (!raw) {
    return {
      plainText: '',
      segments: [],
      unsupportedTags: [],
      note: 'Empty input.',
    };
  }

  // Plain text passthrough (no angle brackets)
  if (!/<[a-zA-Z/!]/.test(raw)) {
    return {
      plainText: raw,
      segments: [{ kind: 'speak', text: raw }],
      unsupportedTags: [],
      note: 'Plain text — no SSML tags.',
    };
  }

  const unsupported = new Set<string>();
  const segments: SpeakSegment[] = [];
  const plainParts: string[] = [];

  // Self-closing and paired tags — lightweight tokenizer
  const tokenRe =
    /<\/?([a-zA-Z][\w:-]*)\b([^>]*?)\/?>|([^<]+)/g;
  const stack: Array<{ tag: string; attrs: string }> = [];
  let m: RegExpExecArray | null;

  while ((m = tokenRe.exec(raw)) !== null) {
    if (m[3] != null) {
      const text = decodeEntities(m[3]).replace(/\s+/g, ' ');
      if (!text.trim()) continue;
      const prosody = [...stack].reverse().find((f) => f.tag === 'prosody');
      const phoneme = [...stack].reverse().find((f) => f.tag === 'phoneme');
      const sayAs = [...stack].reverse().find((f) => f.tag === 'say-as');
      let spoken = text;
      if (phoneme) {
        const ph = attr(phoneme.attrs, 'ph');
        if (ph) spoken = ph; // IPA/alias substitute — vendors may ignore
      }
      if (sayAs) {
        const interpret = (attr(sayAs.attrs, 'interpret-as') ?? '').toLowerCase();
        if (interpret === 'characters' || interpret === 'digits') {
          spoken = spoken.split('').join(' ');
        }
      }
      const rate = prosody ? attr(prosody.attrs, 'rate') : undefined;
      const pitch = prosody ? attr(prosody.attrs, 'pitch') : undefined;
      spoken = applyProsodyHints(spoken, rate, pitch);
      segments.push({
        kind: 'speak',
        text: spoken,
        rateHint: rate,
        pitchHint: pitch,
      });
      plainParts.push(spoken);
      continue;
    }

    const tag = m[1]!.toLowerCase();
    const attrs = m[2] ?? '';
    const selfClosing = /\/\s*$/.test(attrs) || m[0].endsWith('/>');
    const closing = m[0].startsWith('</');

    if (!SUPPORTED.has(tag)) {
      unsupported.add(tag);
      continue;
    }

    if (tag === 'break') {
      const pauseMs = parseBreakMs(attrs);
      segments.push({ kind: 'pause', pauseMs });
      plainParts.push(' ');
      continue;
    }

    if (closing) {
      while (stack.length && stack[stack.length - 1]!.tag !== tag) stack.pop();
      stack.pop();
      continue;
    }

    if (!selfClosing) {
      stack.push({ tag, attrs });
    }
  }

  const plainText = plainParts.join(' ').replace(/\s+/g, ' ').trim();
  return {
    plainText,
    segments: segments.length ? segments : [{ kind: 'speak', text: plainText }],
    unsupportedTags: [...unsupported],
    note:
      'SSML lite compiled to plain speak/pause plan. Vendors do not receive SSML markup. Not a full SSML engine or DAW.',
  };
}

import type { SttSegment } from '../gateway/stt-provider';

export type SubtitleFormat = 'srt' | 'vtt';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

/** Format seconds to SRT timestamp HH:MM:SS,mmm */
export function formatSrtTimestamp(seconds: number): string {
  const msTotal = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(msTotal / 3_600_000);
  const minutes = Math.floor((msTotal % 3_600_000) / 60_000);
  const secs = Math.floor((msTotal % 60_000) / 1000);
  const ms = msTotal % 1000;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)},${pad3(ms)}`;
}

/** Format seconds to WebVTT timestamp HH:MM:SS.mmm */
export function formatVttTimestamp(seconds: number): string {
  return formatSrtTimestamp(seconds).replace(',', '.');
}

export function segmentsToSrt(segments: SttSegment[]): string {
  return segments
    .filter((s) => s.text.trim)
    .map((s, i) => {
      return `${i + 1}\n${formatSrtTimestamp(s.start)} --> ${formatSrtTimestamp(s.end)}\n${s.text.trim}\n`;
    })
    .join('\n');
}

export function segmentsToVtt(segments: SttSegment[]): string {
  const body = segments
    .filter((s) => s.text.trim)
    .map((s) => {
      return `${formatVttTimestamp(s.start)} --> ${formatVttTimestamp(s.end)}\n${s.text.trim}\n`;
    })
    .join('\n');
  return `WEBVTT\n\n${body}`;
}

export function renderSubtitles(segments: SttSegment[], format: SubtitleFormat): string {
  return format === 'vtt' ? segmentsToVtt(segments) : segmentsToSrt(segments);
}

/** Light punctuation/capitalization normalize for Whisper output. */
export function normalizeTranscriptText(text: string): string {
  let out = text.replace(/\s+/g, ' ').trim;
  if (!out) return out;
  // Ensure terminal punctuation on the last sentence when missing.
  if (!/[.!?…"»)]$/.test(out)) {
    out = `${out}.`;
  }
  // Capitalize sentence starts.
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix: string, ch: string) => {
    return `${prefix}${ch.toUpperCase}`;
  });
  if (/^[a-z]/.test(out)) {
    out = out.charAt(0).toUpperCase + out.slice(1);
  }
  return out;
}

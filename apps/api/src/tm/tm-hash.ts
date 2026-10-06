import { createHash } from 'crypto';

/** NFC + trim + collapse whitespace for exact TM matching. */
export function normalizeTmSegment(text: string): string {
  return text.normalize('NFC').trim().replace(/\s+/g, ' ');
}

export function hashTmSegment(text: string): string {
  return createHash('sha256').update(normalizeTmSegment(text), 'utf8').digest('hex');
}

import { createHash, randomBytes } from 'crypto';

export function contentHash(value: unknown): string {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return createHash('sha256').update(payload).digest('hex');
}

export function hashText(text: string): string {
  return contentHash(text.normalize('NFC'));
}

export function hashBuffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

export function mintEventId(): string {
  return `lbv_${randomBytes(10).toString('hex')}`;
}

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      const v = obj[key];
      if (v !== undefined) out[key] = sortValue(v);
    }
    return out;
  }
  return value;
}

export function contentHash(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}

export function hashToken(token: string): string {
  return sha256Hex(token);
}

export function mintToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hmacSign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function hmacVerify(payload: string, signature: string, secret: string): boolean {
  const expected = hmacSign(payload, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

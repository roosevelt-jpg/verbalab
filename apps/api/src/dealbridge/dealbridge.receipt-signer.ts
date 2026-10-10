import { createHash } from 'crypto';
import { canonicalJson, hmacSign, hmacVerify } from './dealbridge.hash';

export type ReceiptSigningKey = {
  keyId: string;
  secret: string;
};

/**
 * Server-side receipt integrity. Uses HMAC-SHA256 with a keyId.
 * Hash alone is not a signature — this returns signature + keyId metadata.
 * Configure DEALBRIDGE_RECEIPT_SIGNING_KEY (and optional DEALBRIDGE_RECEIPT_KEY_ID).
 * When unset, a deterministic local-dev key is derived and labeled as fixture-only.
 */
export function resolveReceiptSigningKey(): ReceiptSigningKey & { fixture: boolean } {
  const configured = process.env.DEALBRIDGE_RECEIPT_SIGNING_KEY?.trim();
  if (configured) {
    return {
      keyId: process.env.DEALBRIDGE_RECEIPT_KEY_ID?.trim() || 'dealbridge-hmac-v1',
      secret: configured,
      fixture: false,
    };
  }
  const seed = process.env.DEALBRIDGE_DEV_SIGNING_SEED?.trim() || 'lugemi-dealbridge-local-dev-only';
  return {
    keyId: 'dealbridge-dev-fixture-v1',
    secret: createHash('sha256').update(seed).digest('hex'),
    fixture: true,
  };
}

export function signReceiptPayload(payload: unknown): {
  contentHash: string;
  signature: string;
  keyId: string;
  fixtureSigning: boolean;
  canonical: string;
} {
  const key = resolveReceiptSigningKey();
  const canonical = canonicalJson(payload);
  const contentHash = createHash('sha256').update(canonical).digest('hex');
  return {
    contentHash,
    signature: hmacSign(canonical, key.secret),
    keyId: key.keyId,
    fixtureSigning: key.fixture,
    canonical,
  };
}

export function verifyReceiptSignature(payload: unknown, signature: string, keyId: string): boolean {
  const key = resolveReceiptSigningKey();
  if (key.keyId !== keyId) return false;
  const canonical = canonicalJson(payload);
  return hmacVerify(canonical, signature, key.secret);
}

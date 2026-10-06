import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import type { VoiceFingerprint } from '../speaker-intelligence/fingerprint';

export type EncryptedFingerprint = {
  enc: 1;
  alg: 'aes-256-gcm';
  iv: string;
  tag: string;
  data: string;
  /** Duration kept in clear for UX / liveness duration checks. */
  durationSeconds: number;
  dims: number;
};

function keyBytes: Buffer {
  const raw =
    process.env.VOICE_BIOMETRIC_KEY?.trim ||
    process.env.ENCRYPTION_KEY?.trim ||
    'lugemi-dev-voice-biometric-key';
  return createHash('sha256').update(raw).digest;
}

export function isEncryptedFingerprint(value: unknown): value is EncryptedFingerprint {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as EncryptedFingerprint).enc === 1 &&
      typeof (value as EncryptedFingerprint).data === 'string',
  );
}

export function encryptFingerprint(fp: VoiceFingerprint): EncryptedFingerprint {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBytes, iv);
  const plaintext = Buffer.from(JSON.stringify(fp), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final]);
  const tag = cipher.getAuthTag;
  return {
    enc: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
    durationSeconds: fp.durationSeconds,
    dims: fp.dims,
  };
}

export function decryptFingerprint(stored: EncryptedFingerprint): VoiceFingerprint {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    keyBytes,
    Buffer.from(stored.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(stored.tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(stored.data, 'base64')),
    decipher.final,
  ]);
  return JSON.parse(decrypted.toString('utf8')) as VoiceFingerprint;
}

/** Resolve plain or encrypted storage to a usable fingerprint vector. */
export function resolveFingerprint(stored: unknown): VoiceFingerprint | null {
  if (!stored || typeof stored !== 'object') return null;
  if (isEncryptedFingerprint(stored)) {
    try {
      return decryptFingerprint(stored);
    } catch {
      return null;
    }
  }
  const fp = stored as VoiceFingerprint;
  if (!Array.isArray(fp.vector) || !fp.vector.length) return null;
  return fp;
}

import { createHash, randomBytes } from 'crypto';

export function contentHash(value: unknown): string {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return createHash('sha256').update(payload).digest('hex');
}

export function hashText(text: string): string {
  return contentHash(text.normalize('NFC'));
}

export function hashAudioBuffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

export function mintEventId(): string {
  return `aev_${randomBytes(10).toString('hex')}`;
}

export function bundleHashFromParts(input: {
  sourceTextHash: string;
  targetTextHash: string;
  audioSha256: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  product: string;
  contentCategory: string;
  corridor: string;
  modelVersion: string | null;
  voiceVersion: string | null;
}): string {
  return contentHash({
    sourceTextHash: input.sourceTextHash,
    targetTextHash: input.targetTextHash,
    audioSha256: input.audioSha256,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    product: input.product,
    contentCategory: input.contentCategory,
    corridor: input.corridor,
    modelVersion: input.modelVersion,
    voiceVersion: input.voiceVersion,
  });
}

import { createHash, randomUUID } from 'crypto';

export type ScriptSegment = {
  stableId: string;
  text: string;
  orderIndex: number;
  contextBefore: string;
  contextAfter: string;
};

/** Language-aware-ish sentence/paragraph splitter with stable IDs. */
export function segmentScript(script: string): ScriptSegment[] {
  const normalized = script.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const raw: string[] = [];
  for (const para of paragraphs) {
    const sentences = para
      .split(/(?<=[.!?。！？።])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length) raw.push(...sentences);
    else raw.push(para);
  }

  return raw.map((text, orderIndex) => ({
    stableId: `seg_${createHash('sha256').update(`${orderIndex}:${text}`).digest('hex').slice(0, 16)}`,
    text,
    orderIndex,
    contextBefore: raw[orderIndex - 1] ?? '',
    contextAfter: raw[orderIndex + 1] ?? '',
  }));
}

export function contentHash(text: string): string {
  return createHash('sha256').update(text.normalize('NFC')).digest('hex');
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

/** Critical-term hints for meaning review (numbers, negations, currencies). */
export function criticalTermFlags(source: string, translated: string): string[] {
  const flags: string[] = [];
  const srcNums = source.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const tgtNums = translated.match(/\d+(?:[.,]\d+)?/g) ?? [];
  if (srcNums.join('|') !== tgtNums.join('|')) flags.push('number_mismatch');
  const neg = /\b(not|no|never|without|unless|cannot|can't)\b/i;
  if (neg.test(source) !== neg.test(translated)) flags.push('negation_shift');
  const money = /[$€£¥₦₵]|USD|EUR|GBP|NGN|GHS|KES/i;
  if (money.test(source) && !money.test(translated)) flags.push('currency_missing');
  return flags;
}

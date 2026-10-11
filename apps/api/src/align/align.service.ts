import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';

export type AlignWord = {
  word: string;
  startMs: number;
  endMs: number;
  confidence: number;
};

/**
 * Forced alignment for captions, LearnBack, and dubbing QA.
 * Uses duration-aware word pacing (phoneme-weighted) when audio duration is known,
 * otherwise estimates from speaking rate for the locale.
 */
@Injectable()
export class AlignService {
  constructor(
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
  ) {}

  async align(input: {
    text: string;
    language?: string;
    /** Optional audio duration in ms — improves end-to-end timing. */
    durationMs?: number;
    /** Optional words-per-minute override (default ~145). */
    wpm?: number;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const text = input.text?.trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if ([...text].length > 20_000) {
      throw new ApiException('validation_error', 'text exceeds 20000 characters', HttpStatus.BAD_REQUEST);
    }

    await this.billing.assertProductQuota(input.organizationId, 'chat', Math.max(1, [...text].length));

    const tokens = tokenize(text);
    if (tokens.length === 0) {
      throw new ApiException('validation_error', 'text has no alignable words', HttpStatus.BAD_REQUEST);
    }

    const weights = tokens.map((w) => Math.max(1, phonemeWeight(w)));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const wpm = Number.isFinite(input.wpm) && (input.wpm ?? 0) > 40 ? Number(input.wpm) : 145;
    const estimatedMs = Math.round((tokens.length / wpm) * 60_000);
    const durationMs =
      Number.isFinite(input.durationMs) && (input.durationMs ?? 0) > 100
        ? Math.floor(Number(input.durationMs))
        : estimatedMs;

    const words: AlignWord[] = [];
    let cursor = 0;
    tokens.forEach((word, i) => {
      const span = Math.max(40, Math.round((weights[i]! / totalWeight) * durationMs));
      const startMs = cursor;
      const endMs = i === tokens.length - 1 ? durationMs : cursor + span;
      words.push({
        word,
        startMs,
        endMs,
        confidence: input.durationMs ? 0.82 : 0.64,
      });
      cursor = endMs;
    });

    await this.usage.recordChat({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      tokens: Math.max(1, tokens.length),
      provider: 'lugemi_align',
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'align.completed',
      route: 'POST /v1/align',
      ip: input.ip,
      metadata: {
        words: words.length,
        durationMs,
        language: input.language ?? null,
        mode: input.durationMs ? 'duration_weighted' : 'rate_estimated',
      },
    });

    return {
      product: 'lugemi_align',
      language: input.language ?? 'auto',
      durationMs,
      mode: input.durationMs ? 'duration_weighted' : 'rate_estimated',
      words,
      srt: toSrt(words),
      vtt: toVtt(words),
    };
  }
}

function tokenize(text: string): string[] {
  return text
    .replace(/[\r\n]+/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function phonemeWeight(word: string): number {
  const clean = word.replace(/[^\p{L}\p{N}']+/gu, '');
  if (!clean) return 1;
  return Math.min(12, Math.max(1, Math.round(clean.length * 0.65)));
}

function fmtTs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const frac = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(frac).padStart(3, '0')}`;
}

function toSrt(words: AlignWord[]): string {
  // Group ~8 words per cue for readable captions.
  const cues: string[] = [];
  for (let i = 0, n = 1; i < words.length; i += 8, n += 1) {
    const slice = words.slice(i, i + 8);
    const start = slice[0]!.startMs;
    const end = slice[slice.length - 1]!.endMs;
    cues.push(`${n}\n${fmtTs(start)} --> ${fmtTs(end)}\n${slice.map((w) => w.word).join(' ')}\n`);
  }
  return cues.join('\n');
}

function toVtt(words: AlignWord[]): string {
  const srt = toSrt(words);
  return `WEBVTT\n\n${srt.replace(/,/g, '.')}`;
}

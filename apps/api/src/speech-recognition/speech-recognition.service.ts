import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AudioService } from '../audio/audio.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import type { SttSegment } from '../gateway/stt-provider';
import { speechEngineCatalog } from './speech-engine.catalog';
import {
  buildVocabularyPrompt,
  IndustryPackId,
  speechIndustryVocabularyPacks,
} from './vocabulary.catalog';
import {
  normalizeTranscriptText,
  renderSubtitles,
  SubtitleFormat,
} from './subtitles';

export type RecognizeOptions = {
  file: Express.Multer.File;
  language?: string;
  /** When true (default), omit → Whisper auto-detect if language unset. */
  detectLanguage?: boolean;
  industryPacks?: IndustryPackId[];
  /** Extra one-shot phrases for this request. */
  vocabulary?: string[];
  /** Include workspace custom vocabulary terms. Default true. */
  useWorkspaceVocabulary?: boolean;
  punctuate?: boolean;
  capitalize?: boolean;
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

export type RecognitionResult = {
  text: string;
  language: string | null;
  durationSeconds: number;
  durationMinutes: number;
  provider: string;
  confidence: number | null;
  segments: SttSegment[];
  vocabularyApplied: boolean;
  industryPacks: IndustryPackId[];
  detectedLanguage: boolean;
};

@Injectable()
export class SpeechRecognitionService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly audio: AudioService,
    private readonly billing: BillingService,
  ) {}

  engine() {
    return speechEngineCatalog();
  }

  async analytics(organizationId: string) {
    const summary = await this.usage.summary(organizationId);
    return {
      periodStart: summary.periodStart,
      stt: summary.stt,
      product: 'Lugemi Speech',
      note: 'Usage metering for STT. Full Speech Analytics: GET /v1/speech-analytics/*.',
      docs: '/docs/SPEECH_ANALYTICS.md',
    };
  }

  listIndustryPacks() {
    return {
      packs: speechIndustryVocabularyPacks().map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        phraseCount: p.phrases.length,
        phrases: p.phrases,
      })),
    };
  }

  async listCustomVocabulary(organizationId: string, workspaceId: string) {
    const terms = await this.prisma.speechVocabularyTerm.findMany({
      where: { organizationId, workspaceId },
      orderBy: { phrase: 'asc' },
    });
    return {
      terms: terms.map((t) => ({
        id: t.id,
        phrase: t.phrase,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  async addCustomVocabulary(input: {
    organizationId: string;
    workspaceId: string;
    phrase: string;
    userId?: string;
    ip?: string;
  }) {
    const phrase = input.phrase.trim();
    if (!phrase || phrase.length > 120) {
      throw new ApiException(
        'validation_error',
        'phrase must be 1–120 characters',
        HttpStatus.BAD_REQUEST,
      );
    }
    const count = await this.prisma.speechVocabularyTerm.count({
      where: { organizationId: input.organizationId, workspaceId: input.workspaceId },
    });
    if (count >= 200) {
      throw new ApiException(
        'validation_error',
        'Maximum 200 custom vocabulary phrases per workspace',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const row = await this.prisma.speechVocabularyTerm.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          phrase,
        },
      });
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'speech.vocabulary_added',
        route: 'POST /v1/speech/vocabulary',
        ip: input.ip,
        metadata: { phrase },
      });
      return { id: row.id, phrase: row.phrase, createdAt: row.createdAt.toISOString() };
    } catch {
      throw new ApiException(
        'conflict',
        'Phrase already exists in this workspace',
        HttpStatus.CONFLICT,
      );
    }
  }

  async removeCustomVocabulary(input: {
    organizationId: string;
    workspaceId: string;
    id: string;
    userId?: string;
    ip?: string;
  }) {
    const existing = await this.prisma.speechVocabularyTerm.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!existing) {
      throw new ApiException('not_found', 'Vocabulary term not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.speechVocabularyTerm.delete({ where: { id: existing.id } });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'speech.vocabulary_removed',
      route: 'DELETE /v1/speech/vocabulary/:id',
      ip: input.ip,
      metadata: { phrase: existing.phrase },
    });
    return { deleted: true, id: existing.id };
  }

  async recognize(input: RecognizeOptions): Promise<RecognitionResult> {
    this.audio.assertAllowedAudio(input.file);

    const industryPacks = (input.industryPacks ?? []).filter(isIndustryPack);
    const workspacePhrases =
      input.useWorkspaceVocabulary === false
        ? []
        : (
            await this.prisma.speechVocabularyTerm.findMany({
              where: {
                organizationId: input.organizationId,
                workspaceId: input.workspaceId,
              },
              select: { phrase: true },
              take: 80,
            })
          ).map((t) => t.phrase);

    const prompt = buildVocabularyPrompt({
      industryPackIds: industryPacks,
      customPhrases: [...workspacePhrases, ...(input.vocabulary ?? [])],
    });

    const languageHint =
      input.detectLanguage === false && !input.language
        ? undefined
        : input.language?.trim() || undefined;

    await this.billing.assertProductQuota(input.organizationId, 'stt', 60);

    const result = await this.gateway.transcribe({
      buffer: input.file.buffer,
      filename: input.file.originalname,
      mimeType: input.file.mimetype || 'application/octet-stream',
      language: languageHint,
      prompt,
    });

    let text = result.text;
    if (input.punctuate !== false || input.capitalize !== false) {
      text = normalizeTranscriptText(text);
    }

    const segments = (result.segments ?? []).map((s) => ({
      ...s,
      text: s.text.trim(),
    }));

    const durationSeconds = Math.max(1, Math.ceil(result.durationSeconds));
    await this.usage.recordStt({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      seconds: durationSeconds,
      provider: result.provider,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'speech.recognized',
      route: 'POST /v1/speech/recognize',
      ip: input.ip,
      metadata: {
        provider: result.provider,
        language: result.language,
        durationSeconds,
        segmentCount: segments.length,
        vocabularyApplied: Boolean(prompt),
        industryPacks,
        confidence: result.confidence ?? null,
      },
    });

    return {
      text,
      language: result.language ?? languageHint ?? null,
      durationSeconds,
      durationMinutes: Math.round((durationSeconds / 60) * 1000) / 1000,
      provider: result.provider,
      confidence: result.confidence ?? null,
      segments,
      vocabularyApplied: Boolean(prompt),
      industryPacks,
      detectedLanguage: !languageHint,
    };
  }

  async *streamRecognize(
    input: RecognizeOptions,
  ): AsyncGenerator<
    | { event: 'start'; provider: string; vocabularyApplied: boolean }
    | { event: 'segment'; segment: SttSegment; index: number }
    | {
        event: 'done';
        text: string;
        language: string | null;
        durationSeconds: number;
        confidence: number | null;
        segmentCount: number;
      }
    | { event: 'error'; message: string }
  > {
    try {
      const result = await this.recognize({
        ...input,
      });
      yield {
        event: 'start',
        provider: result.provider,
        vocabularyApplied: result.vocabularyApplied,
      };
      for (let i = 0; i < result.segments.length; i++) {
        yield { event: 'segment', segment: result.segments[i]!, index: i };
      }
      // If vendor returned no segments, emit one synthetic segment for the full text.
      if (!result.segments.length && result.text) {
        yield {
          event: 'segment',
          index: 0,
          segment: {
            id: 0,
            start: 0,
            end: result.durationSeconds,
            text: result.text,
            confidence: result.confidence ?? undefined,
          },
        };
      }
      yield {
        event: 'done',
        text: result.text,
        language: result.language,
        durationSeconds: result.durationSeconds,
        confidence: result.confidence,
        segmentCount: result.segments.length || (result.text ? 1 : 0),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Recognition failed';
      yield { event: 'error', message };
    }
  }

  async subtitles(input: RecognizeOptions & { format?: SubtitleFormat }) {
    const result = await this.recognize(input);
    const format: SubtitleFormat = input.format === 'vtt' ? 'vtt' : 'srt';
    const segments =
      result.segments.length > 0
        ? result.segments
        : result.text
          ? [
              {
                id: 0,
                start: 0,
                end: result.durationSeconds,
                text: result.text,
                confidence: result.confidence ?? undefined,
              },
            ]
          : [];
    const content = renderSubtitles(segments, format);
    return {
      format,
      content,
      language: result.language,
      durationSeconds: result.durationSeconds,
      provider: result.provider,
      confidence: result.confidence,
      cueCount: segments.filter((s) => s.text.trim()).length,
    };
  }
}

function isIndustryPack(value: string): value is IndustryPackId {
  return (
    value === 'medical' ||
    value === 'legal' ||
    value === 'financial' ||
    value === 'government'
  );
}

export function parseIndustryPacks(raw: unknown): IndustryPackId[] {
  if (raw == null || raw === '') return [];
  const parts = Array.isArray(raw)
    ? raw.map(String)
    : String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  const out: IndustryPackId[] = [];
  for (const p of parts) {
    if (isIndustryPack(p) && !out.includes(p)) out.push(p);
  }
  return out;
}

export function parseStringList(raw: unknown): string[] {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    }
  } catch {
    /* comma-separated */
  }
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

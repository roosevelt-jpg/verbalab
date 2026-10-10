import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { AudioService } from '../audio/audio.service';
import { ApiException } from '../common/errors/api-exception';
import { analyzeAudioBuffer } from '../audio-intelligence/audio-dsp';
import { pronunciationEngineCatalog } from './pronunciation-engine.catalog';
import {
  alignWords,
  fluencyFromMetrics,
  scoreFromAlignment,
  tokenize,
} from './pronunciation-score';
import { analyzePhonemes, stressScoreFromWords } from './pronunciation-phonemes';
import { coachingTips } from './pronunciation-coaching';

@Injectable()
export class PronunciationIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GatewayService,
    private readonly audit: AuditService,
    private readonly usage: UsageService,
    private readonly audio: AudioService,
  ) {}

  engine() {
    return pronunciationEngineCatalog();
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        action: { startsWith: 'pronunciation.' },
        createdAt: { gte: since },
      },
      select: { action: true, metadata: true },
      take: 5000,
    });
    const byAction: Record<string, number> = {};
    let scoreSum = 0;
    let scored = 0;
    for (const e of events) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      if (typeof meta.overall === 'number') {
        scoreSum += meta.overall;
        scored += 1;
      }
    }
    return {
      windowDays: 30,
      total: events.length,
      byAction,
      averageOverall: scored ? Number((scoreSum / scored).toFixed(1)) : null,
      note: 'Org audit-derived Pronunciation Intelligence usage — not CEFR certification.',
    };
  }

  async assess(input: {
    reference: string;
    hypothesis?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
    skipAudit?: boolean;
  }) {
    const result = await this.resolveAssessment(input);
    if (!input.skipAudit) {
      await this.record(input, 'pronunciation.assess', 'POST /v1/pronunciation/assess', {
        overall: result.scores.overall,
        language: result.language,
        inputMode: result.inputMode,
      });
    }
    return result;
  }

  async score(input: {
    reference: string;
    hypothesis?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const full = await this.assess({ ...input, skipAudit: true });
    await this.record(input, 'pronunciation.score', 'POST /v1/pronunciation/score', {
      overall: full.scores.overall,
      language: full.language,
      inputMode: full.inputMode,
    });
    return {
      scores: full.scores,
      language: full.language,
      note: full.note,
    };
  }

  async coach(input: {
    reference: string;
    hypothesis?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const full = await this.assess({ ...input, skipAudit: true });
    await this.record(input, 'pronunciation.coach', 'POST /v1/pronunciation/coach', {
      tipCount: full.coaching.length,
      overall: full.scores.overall,
      language: full.language,
    });
    return {
      scores: full.scores,
      coaching: full.coaching,
      language: full.language,
      note: 'Rule/tip coaching from mismatches — not acoustic accent models.',
    };
  }

  phonemes(input: { text: string; language?: string }) {
    const text = input.text?.trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    const language = (input.language ?? 'en').trim() || 'en';
    const words = analyzePhonemes(text, language);
    return {
      language,
      words,
      note: 'Dictionary + grapheme→phoneme heuristics — not forced-alignment phoneme ASR.',
    };
  }

  async fluency(input: {
    reference?: string;
    language?: string;
    file: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    this.audio.assertAllowedAudio(input.file);
    const analysis = analyzeAudioBuffer(input.file.buffer);
    const language = (input.language ?? 'en').trim() || 'en';

    let wordCount = input.reference ? tokenize(input.reference).length : 0;
    let transcript: string | undefined;
    if (!wordCount) {
      const result = await this.gateway.transcribe({
        buffer: input.file.buffer,
        filename: input.file.originalname,
        mimeType: input.file.mimetype || 'application/octet-stream',
        language,
      });
      const durationSeconds = Math.max(1, Math.ceil(result.durationSeconds));
      await this.usage.recordStt({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        seconds: durationSeconds,
        provider: result.provider,
      });
      transcript = result.text.trim();
      wordCount = tokenize(transcript).length;
      if (result.durationSeconds > 0) {
        analysis.durationSeconds = result.durationSeconds;
      }
    }

    const duration = Math.max(0.1, analysis.durationSeconds);
    const wordsPerSecond = wordCount / duration;
    const fluency = fluencyFromMetrics({
      wordsPerSecond,
      silenceRatio: analysis.silenceRatio,
      durationSeconds: duration,
    });

    await this.record(input, 'pronunciation.fluency', 'POST /v1/pronunciation/fluency', {
      fluency,
      wordsPerSecond,
    });

    return {
      fluency,
      wordsPerSecond: Number(wordsPerSecond.toFixed(2)),
      wordCount,
      silenceRatio: analysis.silenceRatio,
      speechRatio: analysis.speechRatio,
      durationSeconds: analysis.durationSeconds,
      transcript,
      note: 'Fluency from speaking rate + silence proxies — not prosody ML.',
    };
  }

  async *streamAssess(input: {
    reference: string;
    hypothesis?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }): AsyncGenerator<
    | { event: 'start' }
    | { event: 'transcript'; hypothesis: string }
    | { event: 'scores'; overall: number; accuracy: number; fluency: number }
    | { event: 'done'; note: string }
    | { event: 'error'; message: string }
  > {
    try {
      yield { event: 'start' };
      const result = await this.assess({ ...input });
      yield { event: 'transcript', hypothesis: result.hypothesis };
      yield {
        event: 'scores',
        overall: result.scores.overall,
        accuracy: result.scores.accuracy,
        fluency: result.scores.fluency,
      };
      yield { event: 'done', note: result.note };
    } catch (err) {
      yield {
        event: 'error',
        message: err instanceof Error ? err.message : 'Pronunciation assessment failed',
      };
    }
  }

  private async resolveAssessment(input: {
    reference: string;
    hypothesis?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
  }) {
    const reference = input.reference?.trim();
    if (!reference) {
      throw new ApiException(
        'validation_error',
        'reference text is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const language = (input.language ?? 'en').trim() || 'en';

    let hypothesis = input.hypothesis?.trim() ?? '';
    let stt:
      | { provider: string; durationSeconds: number; language?: string }
      | undefined;
    let audioMetrics: {
      durationSeconds: number;
      silenceRatio: number;
      speechRatio: number;
    } | null = null;

    if (input.file) {
      this.audio.assertAllowedAudio(input.file);
      const analysis = analyzeAudioBuffer(input.file.buffer);
      audioMetrics = {
        durationSeconds: analysis.durationSeconds,
        silenceRatio: analysis.silenceRatio,
        speechRatio: analysis.speechRatio,
      };
      const result = await this.gateway.transcribe({
        buffer: input.file.buffer,
        filename: input.file.originalname,
        mimeType: input.file.mimetype || 'application/octet-stream',
        language,
      });
      const durationSeconds = Math.max(1, Math.ceil(result.durationSeconds));
      await this.usage.recordStt({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        seconds: durationSeconds,
        provider: result.provider,
      });
      hypothesis = result.text.trim();
      stt = {
        provider: result.provider,
        durationSeconds: result.durationSeconds,
        language: result.language,
      };
      if (audioMetrics && result.durationSeconds > 0) {
        audioMetrics.durationSeconds = result.durationSeconds;
      }
    }

    if (!hypothesis) {
      throw new ApiException(
        'validation_error',
        'hypothesis text or audio file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.buildAssessment({
      reference,
      hypothesis,
      language,
      audioMetrics,
      stt,
    });
  }

  private buildAssessment(input: {
    reference: string;
    hypothesis: string;
    language: string;
    audioMetrics: { durationSeconds: number; silenceRatio: number; speechRatio: number } | null;
    stt?: { provider: string; durationSeconds: number; language?: string };
  }) {
    const refTokens = tokenize(input.reference);
    const hypTokens = tokenize(input.hypothesis);
    const alignment = alignWords(refTokens, hypTokens);
    const phonemes = analyzePhonemes(input.reference, input.language);
    const stress = stressScoreFromWords(phonemes);

    const duration = Math.max(
      0.1,
      input.audioMetrics?.durationSeconds ?? Math.max(1, hypTokens.length / 2.5),
    );
    const silenceRatio = input.audioMetrics?.silenceRatio ?? 0.15;
    const wordsPerSecond = hypTokens.length / duration;
    const fluency = fluencyFromMetrics({
      wordsPerSecond,
      silenceRatio,
      durationSeconds: duration,
    });

    const scores = scoreFromAlignment(alignment, fluency, stress);
    const substitutions = alignment
      .filter((a) => a.status === 'substitution')
      .map((a) => `${a.reference}→${a.hypothesis}`);
    const deletions = alignment
      .filter((a) => a.status === 'deletion')
      .map((a) => a.reference!)
      .filter(Boolean);
    const insertions = alignment
      .filter((a) => a.status === 'insertion')
      .map((a) => a.hypothesis!)
      .filter(Boolean);

    const coaching = coachingTips({
      language: input.language,
      substitutions,
      deletions,
      insertions,
      overall: scores.overall,
    });

    return {
      product: 'Pronunciation Intelligence',
      language: input.language,
      reference: input.reference,
      hypothesis: input.hypothesis,
      inputMode: input.stt ? ('audio' as const) : ('text' as const),
      stt: input.stt,
      alignment,
      phonemes: phonemes.slice(0, 40),
      scores,
      fluency: {
        wordsPerSecond: Number(wordsPerSecond.toFixed(2)),
        silenceRatio,
        speechRatio: input.audioMetrics?.speechRatio ?? Number((1 - silenceRatio).toFixed(3)),
        durationSeconds: Number(duration.toFixed(3)),
      },
      coaching,
      note: 'Word alignment + fluency/stress heuristics — not ELSA/SpeechAce or forced-alignment phonemes.',
    };
  }

  private async record(
    input: {
      organizationId: string;
      userId?: string;
      apiKeyId?: string;
      ip?: string;
    },
    action: string,
    route: string,
    metadata: Record<string, unknown>,
  ) {
    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix ?? undefined;
    }
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action,
      route,
      ip: input.ip,
      apiKeyPrefix,
      metadata,
    });
  }
}

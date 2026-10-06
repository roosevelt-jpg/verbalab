import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { AudioService } from '../audio/audio.service';
import { ApiException } from '../common/errors/api-exception';
import { emotionEngineCatalog } from './emotion-engine.catalog';
import { analyzeSpeechEmotion, SpeechEmotionLabel } from './emotion-signals';
import { extractPcmMono } from '../speaker-intelligence/fingerprint';

@Injectable()
export class EmotionIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GatewayService,
    private readonly audit: AuditService,
    private readonly usage: UsageService,
    private readonly audio: AudioService,
  ) {}

  engine() {
    return emotionEngineCatalog();
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        action: { in: ['emotion.detect', 'emotion.stream'] },
        createdAt: { gte: since },
      },
      select: { metadata: true },
      take: 5000,
    });

    const byLabel: Record<string, number> = {};
    let audioInputs = 0;
    let textInputs = 0;
    for (const e of events) {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const label = typeof meta.label === 'string' ? meta.label : 'unknown';
      byLabel[label] = (byLabel[label] ?? 0) + 1;
      if (meta.inputMode === 'audio') audioInputs += 1;
      else textInputs += 1;
    }

    return {
      windowDays: 30,
      detects: events.length,
      byLabel,
      audioInputs,
      textInputs,
      note: 'Org audit-derived Emotion Intelligence usage — not SER model accuracy metrics.',
    };
  }

  async detect(input: {
    text?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
    skipAudit?: boolean;
  }) {
    let text = input.text?.trim() ?? '';
    let stt:
      | { provider: string; durationSeconds: number; language?: string }
      | undefined;
    let audioHints: { rmsEnergy: number; zcrRate: number; durationSeconds: number } | null = null;

    if (input.file) {
      this.audio.assertAllowedAudio(input.file);
      audioHints = computeAudioHints(input.file.buffer);
      const result = await this.gateway.transcribe({
        buffer: input.file.buffer,
        filename: input.file.originalname,
        mimeType: input.file.mimetype || 'application/octet-stream',
        language: input.language,
      });
      const durationSeconds = Math.max(1, Math.ceil(result.durationSeconds));
      await this.usage.recordStt({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        seconds: durationSeconds,
        provider: result.provider,
      });
      text = result.text.trim();
      stt = {
        provider: result.provider,
        durationSeconds: result.durationSeconds,
        language: result.language,
      };
      if (audioHints) {
        audioHints.durationSeconds = result.durationSeconds || audioHints.durationSeconds;
      }
    }

    if (!text) {
      throw new ApiException(
        'validation_error',
        'text or audio file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const analyzed = analyzeSpeechEmotion(text, audioHints);
    const result = {
      label: analyzed.label as SpeechEmotionLabel,
      confidence: analyzed.confidence,
      scores: analyzed.scores,
      signals: analyzed.signals,
      audioAdjusted: analyzed.audioAdjusted,
      emotionalState: {
        label: analyzed.label as SpeechEmotionLabel,
        confidence: analyzed.confidence,
      },
      sentiment: analyzed.sentiment,
      tone: analyzed.tone,
      inputMode: stt ? ('audio' as const) : ('text' as const),
      transcript: stt ? text : undefined,
      stt,
      text,
      product: 'Emotion Intelligence',
      honesty:
        'Heuristic cue lexicon + optional soft audio proxies. Not trained SER, not NIST-certified emotion science, and not a commercial Affective Computing lab.',
      note: analyzed.note,
    };

    if (!input.skipAudit) {
      await this.recordAudit(input, 'emotion.detect', 'POST /v1/emotion/detect', {
        label: result.label,
        confidence: result.confidence,
        sentiment: result.sentiment.label,
        tone: result.tone.label,
        inputMode: result.inputMode,
        audioAdjusted: result.audioAdjusted,
      });
    }

    return result;
  }

  async *streamDetect(input: {
    text?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }): AsyncGenerator<
    | { event: 'start'; inputMode: string }
    | { event: 'scores'; scores: Array<{ label: string; score: number }> }
    | {
        event: 'sentiment';
        label: string;
        score: number;
        confidence: number;
      }
    | {
        event: 'tone';
        label: string;
        confidence: number;
      }
    | {
        event: 'done';
        label: string;
        confidence: number;
        sentiment: string;
        tone: string;
        audioAdjusted: boolean;
        note: string;
        honesty: string;
      }
    | { event: 'error'; message: string }
  > {
    try {
      const result = await this.detect({ ...input, skipAudit: true });
      yield { event: 'start', inputMode: result.inputMode };
      yield {
        event: 'scores',
        scores: result.scores.slice(0, 5).map((s) => ({ label: s.label, score: s.score })),
      };
      yield {
        event: 'sentiment',
        label: result.sentiment.label,
        score: result.sentiment.score,
        confidence: result.sentiment.confidence,
      };
      yield {
        event: 'tone',
        label: result.tone.label,
        confidence: result.tone.confidence,
      };
      yield {
        event: 'done',
        label: result.label,
        confidence: result.confidence,
        sentiment: result.sentiment.label,
        tone: result.tone.label,
        audioAdjusted: result.audioAdjusted,
        note: result.note,
        honesty: result.honesty,
      };
      await this.recordAudit(input, 'emotion.stream', 'POST /v1/emotion/stream', {
        label: result.label,
        confidence: result.confidence,
        sentiment: result.sentiment.label,
        tone: result.tone.label,
        inputMode: result.inputMode,
        audioAdjusted: result.audioAdjusted,
      });
    } catch (err) {
      yield { event: 'error', message: err instanceof Error ? err.message : 'Emotion detect failed' };
    }
  }

  private async recordAudit(
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

function computeAudioHints(buffer: Buffer): {
  rmsEnergy: number;
  zcrRate: number;
  durationSeconds: number;
} {
  const { samples, sampleRate } = extractPcmMono(buffer);
  if (!samples.length) {
    return { rmsEnergy: 0, zcrRate: 0, durationSeconds: 0.1 };
  }
  let energy = 0;
  let zcr = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i] ?? 0;
    energy += s * s;
    if (i > 0) {
      const prev = samples[i - 1] ?? 0;
      if ((s >= 0 && prev < 0) || (s < 0 && prev >= 0)) zcr += 1;
    }
  }
  const rmsEnergy = Math.sqrt(energy / samples.length);
  const zcrRate = zcr / samples.length;
  const durationSeconds = sampleRate > 0 ? samples.length / sampleRate : samples.length / 16000;
  return {
    rmsEnergy: Number(rmsEnergy.toFixed(4)),
    zcrRate: Number(zcrRate.toFixed(4)),
    durationSeconds: Number(durationSeconds.toFixed(3)),
  };
}

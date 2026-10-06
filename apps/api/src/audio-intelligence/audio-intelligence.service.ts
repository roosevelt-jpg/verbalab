import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AudioService } from '../audio/audio.service';
import { audioEngineCatalog } from './audio-engine.catalog';
import {
  analyzeAudioBuffer,
  enhanceAudio,
  isolateVoice,
  upscaleAudio,
} from './audio-dsp';

@Injectable()
export class AudioIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly audio: AudioService,
  ) {}

  engine() {
    return audioEngineCatalog();
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        action: { startsWith: 'audio_intelligence.' },
        createdAt: { gte: since },
      },
      select: { action: true },
      take: 5000,
    });
    const byAction: Record<string, number> = {};
    for (const e of events) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    }
    return {
      windowDays: 30,
      total: events.length,
      byAction,
      note: 'Org audit-derived Audio Intelligence usage — not perceptual quality scores.',
    };
  }

  async analyze(input: {
    file: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    this.audio.assertAllowedAudio(input.file);
    const analysis = analyzeAudioBuffer(input.file.buffer);
    await this.record(input, 'audio_intelligence.analyze', 'POST /v1/audio-intelligence/analyze', {
      noisy: analysis.noisy,
      estimatedSnrDb: analysis.estimatedSnrDb,
      silenceRatio: analysis.silenceRatio,
    });
    return {
      product: 'Audio Intelligence',
      noise: {
        detected: analysis.noisy,
        noiseFloor: analysis.noiseFloor,
        estimatedSnrDb: analysis.estimatedSnrDb,
      },
      silence: {
        ratio: analysis.silenceRatio,
        regions: analysis.silenceRegions,
      },
      metrics: {
        durationSeconds: analysis.durationSeconds,
        sampleRate: analysis.sampleRate,
        rmsEnergy: analysis.rmsEnergy,
        peakAmplitude: analysis.peakAmplitude,
        speechRatio: analysis.speechRatio,
      },
      note: analysis.note,
    };
  }

  async silence(input: {
    file: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    this.audio.assertAllowedAudio(input.file);
    const analysis = analyzeAudioBuffer(input.file.buffer);
    await this.record(input, 'audio_intelligence.silence', 'POST /v1/audio-intelligence/silence', {
      regionCount: analysis.silenceRegions.length,
      silenceRatio: analysis.silenceRatio,
    });
    return {
      silenceRatio: analysis.silenceRatio,
      regions: analysis.silenceRegions,
      durationSeconds: analysis.durationSeconds,
      note: 'Frame-energy silence regions.',
    };
  }

  async enhance(input: {
    file: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    this.audio.assertAllowedAudio(input.file);
    const result = enhanceAudio(input.file.buffer);
    await this.record(input, 'audio_intelligence.enhance', 'POST /v1/audio-intelligence/enhance', {
      snrBefore: result.analysisBefore.estimatedSnrDb,
      snrAfter: result.analysisAfter.estimatedSnrDb,
    });
    return {
      format: 'wav',
      mimeType: 'audio/wav',
      audioBase64: result.wav.toString('base64'),
      bytes: result.wav.length,
      before: {
        estimatedSnrDb: result.analysisBefore.estimatedSnrDb,
        noiseFloor: result.analysisBefore.noiseFloor,
        noisy: result.analysisBefore.noisy,
      },
      after: {
        estimatedSnrDb: result.analysisAfter.estimatedSnrDb,
        noiseFloor: result.analysisAfter.noiseFloor,
        noisy: result.analysisAfter.noisy,
      },
      note: 'Noise gate + mild high-pass + normalize — not ML denoise.',
    };
  }

  async upscale(input: {
    file: Express.Multer.File;
    targetRate?: number;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    this.audio.assertAllowedAudio(input.file);
    const result = upscaleAudio(input.file.buffer, input.targetRate ?? 32000);
    await this.record(input, 'audio_intelligence.upscale', 'POST /v1/audio-intelligence/upscale', {
      fromRate: result.fromRate,
      toRate: result.toRate,
    });
    return {
      format: 'wav',
      mimeType: 'audio/wav',
      audioBase64: result.wav.toString('base64'),
      bytes: result.wav.length,
      fromRate: result.fromRate,
      toRate: result.toRate,
      note: 'Linear sample-rate interpolation — not generative audio upscaling.',
    };
  }

  async isolate(input: {
    file: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    this.audio.assertAllowedAudio(input.file);
    const result = isolateVoice(input.file.buffer);
    await this.record(input, 'audio_intelligence.isolate', 'POST /v1/audio-intelligence/isolate', {
      speechRatio: result.speechRatio,
    });
    return {
      format: 'wav',
      mimeType: 'audio/wav',
      audioBase64: result.wav.toString('base64'),
      bytes: result.wav.length,
      speechRatio: result.speechRatio,
      note: result.note,
    };
  }

  echoStatus() {
    return {
      available: false,
      status: 'deferred',
      capability: 'echo-cancellation',
      note:
        'Echo cancellation requires an AEC reference path or vendor SDK — deferred in . See ADR-0074.',
    };
  }

  async *streamAnalyze(input: {
    file: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }): AsyncGenerator<
    | { event: 'start' }
    | { event: 'metrics'; durationSeconds: number; sampleRate: number }
    | { event: 'noise'; noisy: boolean; estimatedSnrDb: number }
    | { event: 'silence'; silenceRatio: number; regionCount: number }
    | { event: 'done'; note: string }
    | { event: 'error'; message: string }
  > {
    try {
      this.audio.assertAllowedAudio(input.file);
      yield { event: 'start' };
      const analysis = analyzeAudioBuffer(input.file.buffer);
      yield {
        event: 'metrics',
        durationSeconds: analysis.durationSeconds,
        sampleRate: analysis.sampleRate,
      };
      yield {
        event: 'noise',
        noisy: analysis.noisy,
        estimatedSnrDb: analysis.estimatedSnrDb,
      };
      yield {
        event: 'silence',
        silenceRatio: analysis.silenceRatio,
        regionCount: analysis.silenceRegions.length,
      };
      yield { event: 'done', note: analysis.note };
      await this.record(
        input,
        'audio_intelligence.analyze_stream',
        'POST /v1/audio-intelligence/analyze/stream',
        { noisy: analysis.noisy },
      );
    } catch (err) {
      yield {
        event: 'error',
        message: err instanceof Error ? err.message : 'Audio analysis failed',
      };
    }
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

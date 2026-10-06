import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AudioService } from '../audio/audio.service';
import { ApiException } from '../common/errors/api-exception';
import { upscaleAudio } from '../audio-intelligence/audio-dsp';
import { voiceEnhancementEngineCatalog } from './voice-enhancement.catalog';
import {
  applyEnhancementProfile,
  ENHANCEMENT_PROFILES,
  getEnhancementProfile,
} from './enhancement-profiles';

export type EnhanceAuth = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

@Injectable()
export class VoiceEnhancementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly audio: AudioService,
  ) {}

  engine() {
    return voiceEnhancementEngineCatalog();
  }

  profiles() {
    return {
      profiles: ENHANCEMENT_PROFILES.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        steps: p.steps,
        spectralMl: p.spectralMl,
        echoCancellation: p.echoCancellation,
      })),
      note:
        'Profiles chain VL-155 PCM heuristics. Not Krisp / Adobe Enhance / Demucs / live AEC.',
      docs: '/docs/VOICE_ENHANCEMENT.md',
    };
  }

  echoStatus() {
    return {
      available: false,
      status: 'deferred',
      capability: 'echo-cancellation',
      note:
        'Echo cancellation requires an AEC reference path or vendor SDK — deferred in VL-175 (same honesty as VL-155). See ADR-0086.',
      docs: '/docs/VOICE_ENHANCEMENT.md',
    };
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        action: { startsWith: 'voice_enhancement.' },
        createdAt: { gte: since },
      },
      select: { action: true, metadata: true },
      take: 5000,
    });
    const byAction: Record<string, number> = {};
    const byProfile: Record<string, number> = {};
    for (const e of events) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
      const meta = e.metadata as { profile?: string } | null;
      if (meta?.profile) {
        byProfile[meta.profile] = (byProfile[meta.profile] ?? 0) + 1;
      }
    }
    return {
      windowDays: 30,
      total: events.length,
      byAction,
      byProfile,
      product: 'VerbaLab Voice Enhancement',
      note: 'Profile usage from audit. Full Voice Analytics = Phase 35.',
      docs: '/docs/VOICE_ENHANCEMENT.md',
    };
  }

  async enhance(
    auth: EnhanceAuth,
    input: { file: Express.Multer.File; profile?: string; targetRate?: number },
  ) {
    this.audio.assertAllowedAudio(input.file);
    const profileId = (input.profile?.trim() || 'noise_removal') as string;
    if (!getEnhancementProfile(profileId)) {
      throw new ApiException(
        'validation_error',
        `Unknown profile "${profileId}". Use GET /v1/voice-enhancement/profiles.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let result;
    try {
      result = applyEnhancementProfile(input.file.buffer, profileId, {
        targetRate: input.targetRate,
      });
    } catch (err) {
      throw new ApiException(
        'validation_error',
        err instanceof Error ? err.message : 'Enhance failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_enhancement.enhance',
      route: 'POST /v1/voice-enhancement/enhance',
      ip: auth.ip,
      metadata: {
        profile: result.profile.id,
        steps: result.stepsApplied,
        snrBefore: result.analysisBefore.estimatedSnrDb,
        snrAfter: result.analysisAfter.estimatedSnrDb,
        bytes: result.wav.length,
      },
    });

    return {
      format: 'wav',
      mimeType: 'audio/wav',
      audioBase64: result.wav.toString('base64'),
      bytes: result.wav.length,
      profile: result.profile.id,
      stepsApplied: result.stepsApplied,
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
      note: result.note,
    };
  }

  async upscale(
    auth: EnhanceAuth,
    input: { file: Express.Multer.File; targetRate?: number },
  ) {
    this.audio.assertAllowedAudio(input.file);
    const result = upscaleAudio(input.file.buffer, input.targetRate ?? 32000);
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_enhancement.upscale',
      route: 'POST /v1/voice-enhancement/upscale',
      ip: auth.ip,
      metadata: { fromRate: result.fromRate, toRate: result.toRate },
    });
    return {
      format: 'wav',
      mimeType: 'audio/wav',
      audioBase64: result.wav.toString('base64'),
      bytes: result.wav.length,
      fromRate: result.fromRate,
      toRate: result.toRate,
      profile: 'upscale',
      note: 'Linear sample-rate interpolation — not generative audio upscaling.',
    };
  }

  async *streamEnhance(
    auth: EnhanceAuth,
    input: { file: Express.Multer.File; profile?: string; targetRate?: number },
  ): AsyncGenerator<{ event: 'meta' | 'progress' | 'done' | 'error'; [key: string]: unknown }> {
    try {
      const profileId = input.profile?.trim() || 'noise_removal';
      const profile = getEnhancementProfile(profileId);
      if (!profile) {
        yield {
          event: 'error',
          message: `Unknown profile "${profileId}"`,
        };
        return;
      }
      yield {
        event: 'meta',
        profile: profile.id,
        steps: profile.steps,
        note: 'Full-buffer enhance then SSE progress — not live AEC.',
      };
      yield { event: 'progress', pct: 20, stage: 'dsp' };
      const result = await this.enhance(auth, input);
      yield { event: 'progress', pct: 90, stage: 'encode' };
      yield {
        event: 'done',
        profile: result.profile,
        stepsApplied: result.stepsApplied,
        mimeType: result.mimeType,
        format: result.format,
        bytes: result.bytes,
        audioBase64: result.audioBase64,
        before: result.before,
        after: result.after,
        note: result.note,
      };
    } catch (error) {
      yield {
        event: 'error',
        message: error instanceof Error ? error.message : 'Enhance stream failed',
      };
    }
  }
}

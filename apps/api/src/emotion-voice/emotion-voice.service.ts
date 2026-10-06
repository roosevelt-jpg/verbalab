import { HttpStatus, Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { voiceCloneIdFromVoice } from '../voice-clones/voice-clones.service';
import { emotionVoiceEngineCatalog } from './emotion-voice.catalog';
import {
  applySoftProsody,
  EMOTION_VOICE_PROFILES,
  getEmotionProfile,
} from './emotion-profiles';

const STREAM_CHUNK_BYTES = 8 * 1024;

export type EmotionSynthesizeInput = {
  text: string;
  emotion: string;
  voice?: string;
  language?: string;
  format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

@Injectable()
export class EmotionVoiceService {
  constructor(
    private readonly audio: AudioService,
    private readonly audit: AuditService,
    private readonly usage: UsageService,
    private readonly prisma: PrismaService,
  ) {}

  engine() {
    return emotionVoiceEngineCatalog();
  }

  profiles() {
    return {
      profiles: EMOTION_VOICE_PROFILES.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        preferredVoice: p.preferredVoice,
        prosody: p.prosody,
        expressiveCloneControl: Boolean(p.elevenLabs),
      })),
      note:
        'Profiles drive soft prosody + voice defaults. Trained emotion TTS models are not claimed. Distinct from /v1/emotion detect (VL-154).',
      docs: '/docs/EMOTION_VOICE.md',
    };
  }

  async analytics(organizationId: string) {
    const summary = await this.usage.summary(organizationId);
    const since = new Date(summary.periodStart);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        action: { in: ['emotion_voice.synthesized', 'emotion_voice.streamed'] },
        createdAt: { gte: since },
      },
      select: { metadata: true },
      take: 500,
    });
    const byEmotion: Record<string, number> = {};
    for (const event of events) {
      const meta = event.metadata as { emotion?: string } | null;
      const key = meta?.emotion ?? 'unknown';
      byEmotion[key] = (byEmotion[key] ?? 0) + 1;
    }
    return {
      periodStart: summary.periodStart,
      tts: summary.tts,
      emotionVoiceRequests: events.length,
      byEmotion,
      product: 'VerbaLab Emotion Voice',
      note: 'Profile usage from audit events. Full Voice Analytics = Phase 35.',
      docs: '/docs/EMOTION_VOICE.md',
    };
  }

  resolvePlan(input: { text: string; emotion: string; voice?: string }) {
    const profile = getEmotionProfile(input.emotion);
    if (!profile) {
      throw new ApiException(
        'validation_error',
        `Unknown emotion profile "${input.emotion}". Use GET /v1/emotion-voice/profiles.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const renderedText = applySoftProsody(input.text, profile.prosody);
    const voice = input.voice?.trim() || profile.preferredVoice;
    const cloneExpressive = Boolean(voiceCloneIdFromVoice(voice) && profile.elevenLabs);
    return {
      profile,
      renderedText,
      voice,
      expressiveSettings: cloneExpressive ? profile.elevenLabs : undefined,
      mode: cloneExpressive ? 'clone_style_settings' : 'soft_prosody_voice_pick',
    };
  }

  async synthesize(input: EmotionSynthesizeInput) {
    const plan = this.resolvePlan(input);
    const result = await this.audio.speak({
      text: plan.renderedText,
      voice: plan.voice,
      language: input.language,
      format: input.format,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
      expressiveSettings: plan.expressiveSettings,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'emotion_voice.synthesized',
      route: 'POST /v1/emotion-voice/synthesize',
      ip: input.ip,
      metadata: {
        emotion: plan.profile.id,
        voice: result.voice,
        provider: result.provider,
        characters: result.characters,
        mode: plan.mode,
        watermarkApplied: result.watermarkApplied,
      },
    });

    return {
      ...result,
      emotion: plan.profile.id,
      renderedText: plan.renderedText,
      mode: plan.mode,
    };
  }

  async *streamSynthesize(input: EmotionSynthesizeInput): AsyncGenerator<{
    event: 'meta' | 'audio' | 'done' | 'error';
    [key: string]: unknown;
  }> {
    try {
      const plan = this.resolvePlan(input);
      yield {
        event: 'meta',
        emotion: plan.profile.id,
        voice: plan.voice,
        mode: plan.mode,
        renderedText: plan.renderedText,
        note:
          'Emotion Voice uses soft prosody + voice pick; clone voices may apply ElevenLabs style settings. Not trained expressive TTS.',
      };

      const result = await this.audio.speak({
        text: plan.renderedText,
        voice: plan.voice,
        language: input.language,
        format: input.format,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
        expressiveSettings: plan.expressiveSettings,
      });

      let index = 0;
      for (let offset = 0; offset < result.audio.length; offset += STREAM_CHUNK_BYTES) {
        const slice = result.audio.subarray(offset, offset + STREAM_CHUNK_BYTES);
        yield {
          event: 'audio',
          index,
          encoding: 'base64',
          data: slice.toString('base64'),
          bytes: slice.length,
        };
        index += 1;
      }

      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'emotion_voice.streamed',
        route: 'POST /v1/emotion-voice/stream',
        ip: input.ip,
        metadata: {
          emotion: plan.profile.id,
          voice: result.voice,
          provider: result.provider,
          characters: result.characters,
          chunks: index,
          mode: plan.mode,
        },
      });

      yield {
        event: 'done',
        emotion: plan.profile.id,
        chunks: index,
        bytes: result.audio.length,
        provider: result.provider,
      };
    } catch (error) {
      yield {
        event: 'error',
        message: error instanceof Error ? error.message : 'Emotion voice stream failed',
      };
    }
  }
}

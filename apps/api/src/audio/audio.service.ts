import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { VoiceClonesService, voiceCloneIdFromVoice } from '../voice-clones/voice-clones.service';
import { audioMaxBytes } from './audio-limits';

export { audioMaxBytes };

const ALLOWED_EXT = new Set(['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg', 'flac']);

@Injectable()
export class AudioService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly voiceClones: VoiceClonesService,
  ) {}

  assertAllowedAudio(file: { size: number; originalname: string; mimetype: string }) {
    if (file.size <= 0) {
      throw new ApiException('validation_error', 'Empty audio file', HttpStatus.BAD_REQUEST);
    }
    if (file.size > audioMaxBytes()) {
      throw new ApiException(
        'validation_error',
        `Audio exceeds maximum size of ${audioMaxBytes()} bytes`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXT.has(ext)) {
      throw new ApiException(
        'validation_error',
        `Unsupported audio type .${ext || 'unknown'}. Use mp3, wav, m4a, webm, ogg, or flac.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async transcribe(input: {
    file: Express.Multer.File;
    language?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    this.assertAllowedAudio(input.file);

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

    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'audio.transcribed',
      route: 'POST /v1/audio/transcriptions',
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        provider: result.provider,
        language: result.language,
        durationSeconds,
        characters: [...result.text].length,
      },
    });

    return {
      text: result.text,
      language: result.language ?? input.language ?? null,
      durationSeconds,
      durationMinutes: Math.round((durationSeconds / 60) * 1000) / 1000,
      provider: result.provider,
      confidence: result.confidence ?? null,
      segments: result.segments ?? [],
    };
  }

  listVoices() {
    return { data: this.gateway.listVoices() };
  }

  async speak(input: {
    text: string;
    voice: string;
    language?: string;
    format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
    /** Optional third-party TTS expressive settings for clone:{id} only. */
    expressiveSettings?: {
      stability: number;
      similarity_boost: number;
      style: number;
    };
  }) {
    const text = input.text.trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    const maxChars = Number(process.env.TTS_MAX_CHARS ?? 4096);
    if ([...text].length > maxChars) {
      throw new ApiException(
        'validation_error',
        `text exceeds maximum of ${maxChars} characters`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!input.voice) {
      throw new ApiException('validation_error', 'voice is required', HttpStatus.BAD_REQUEST);
    }

    let result;
    let watermarkApplied = false;
    if (voiceCloneIdFromVoice(input.voice)) {
      const resolved = await this.voiceClones.resolveForSpeech({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        voice: input.voice,
      });
      if (!resolved) {
        throw new ApiException('not_found', 'Voice clone not found', HttpStatus.NOT_FOUND);
      }
      result = await this.voiceClones.synthesizeClone({
        text,
        voice: input.voice,
        providerVoiceId: resolved.providerVoiceId,
        format: input.format ?? 'mp3',
        voiceSettings: input.expressiveSettings,
      });
      watermarkApplied = true;
    } else {
      result = await this.gateway.synthesize({
        text,
        voice: input.voice,
        language: input.language,
        format: input.format ?? 'mp3',
      });
    }

    await this.usage.recordTts({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      characters: result.characters,
      provider: result.provider,
    });

    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'audio.synthesized',
      route: 'POST /v1/audio/speech',
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        provider: result.provider,
        voice: result.voice,
        characters: result.characters,
        format: result.format,
        bytes: result.audio.length,
        watermarkApplied,
        voiceClone: Boolean(voiceCloneIdFromVoice(input.voice)),
      },
    });

    return { ...result, watermarkApplied };
  }
}

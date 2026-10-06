import { HttpStatus, Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { TranslateService } from '../translate/translate.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';

@Injectable()
export class InterpretService {
  constructor(
    private readonly audio: AudioService,
    private readonly translate: TranslateService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async interpret(input: {
    file: Express.Multer.File;
    target: string;
    source?: string;
    language?: string;
    voice: string;
    format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    if (typeof input.target !== 'string' || !input.target.trim()) {
      throw new ApiException('validation_error', 'target is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof input.voice !== 'string' || !input.voice.trim()) {
      throw new ApiException('validation_error', 'voice is required', HttpStatus.BAD_REQUEST);
    }

    const stt = await this.audio.transcribe({
      file: input.file,
      language: input.language,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });

    const sourceText = stt.text.trim();
    if (!sourceText) {
      throw new ApiException(
        'detection_failed',
        'Transcription produced empty text',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const source =
      (input.source?.trim() || stt.language || 'auto').toLowerCase() || 'auto';
    const target = input.target.trim().toLowerCase();

    let targetText = sourceText;
    let mtProvider: string | null = null;
    let mtSource = source === 'auto' ? (stt.language ?? 'auto') : source;
    let skippedMt = false;

    if (source !== 'auto' && source === target) {
      skippedMt = true;
    } else {
      const mt = await this.translate.translate({
        text: sourceText,
        source,
        target,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
        skipReview: true,
      });
      targetText = mt.text;
      mtProvider = mt.provider;
      mtSource = mt.source;
    }

    const format = input.format ?? 'mp3';
    const tts = await this.audio.speak({
      text: targetText,
      voice: input.voice.trim(),
      language: target,
      format,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });

    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'interpret.completed',
      route: 'POST /v1/interpret',
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        source: mtSource,
        target,
        durationSeconds: stt.durationSeconds,
        voice: tts.voice,
        format: tts.format,
        skippedMt,
        providers: {
          stt: stt.provider,
          mt: mtProvider,
          tts: tts.provider,
        },
      },
    });

    return {
      sourceText,
      targetText,
      source: mtSource,
      target,
      durationSeconds: stt.durationSeconds,
      durationMinutes: stt.durationMinutes,
      voice: tts.voice,
      format: tts.format,
      mimeType: tts.mimeType,
      audioBase64: tts.audio.toString('base64'),
      skippedMt,
      providers: {
        stt: stt.provider,
        mt: mtProvider,
        tts: tts.provider,
      },
    };
  }
}

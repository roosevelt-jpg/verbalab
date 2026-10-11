import { createHash, randomBytes } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';

const NAMESPACE = 'speech_embed';

export type SpeechEmbedProject = {
  id: string;
  title: string;
  text: string;
  voice: string;
  language?: string;
  organizationId: string;
  workspaceId: string;
  createdAt: string;
};

/**
 * Site speech players — drop-in embed snippets that narrate article or product copy
 * with Lugemi Echo voices (Audio Native–class surface under Lugemi branding).
 */
@Injectable()
export class SpeechEmbedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
  ) {}

  async create(input: {
    title?: string;
    text: string;
    voice: string;
    language?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const text = input.text?.trim();
    const voice = input.voice?.trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (!voice) {
      throw new ApiException('validation_error', 'voice is required', HttpStatus.BAD_REQUEST);
    }
    if ([...text].length > 40_000) {
      throw new ApiException('validation_error', 'text exceeds 40000 characters', HttpStatus.BAD_REQUEST);
    }

    const known = this.gateway.listVoices().some((v) => v.id === voice);
    if (!known && !voice.startsWith('clone:') && !voice.startsWith('own:')) {
      throw new ApiException('validation_error', `unknown voice: ${voice}`, HttpStatus.BAD_REQUEST);
    }

    await this.billing.assertProductQuota(input.organizationId, 'tts', Math.max(1, [...text].length));

    const id = `emb_${randomBytes(8).toString('hex')}`;
    const project: SpeechEmbedProject = {
      id,
      title: (input.title?.trim() || 'Lugemi Speech Player').slice(0, 120),
      text,
      voice,
      language: input.language?.trim() || undefined,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      createdAt: new Date().toISOString(),
    };

    await this.prisma.cacheEntry.upsert({
      where: {
        organizationId_workspaceId_namespace_cacheKey: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          namespace: NAMESPACE,
          cacheKey: id,
        },
      },
      create: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        namespace: NAMESPACE,
        cacheKey: id,
        valueJson: project as object,
        labels: ['speech_embed', 'public_player'],
        metadata: {
          publicId: id,
          fingerprint: createHash('sha256').update(text).digest('hex').slice(0, 16),
        },
      },
      update: {
        valueJson: project as object,
        labels: ['speech_embed', 'public_player'],
      },
    });

    await this.usage.recordTts({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      characters: [...text].length,
      provider: 'lugemi_speech_embed',
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'speech_embed.created',
      route: 'POST /v1/speech-embed',
      ip: input.ip,
      metadata: { id, characters: [...text].length, voice },
    });

    const webBase = publicWebBase();
    const playerUrl = `${webBase}/embed/${id}`;
    const snippet = [
      `<!-- Lugemi Speech Player -->`,
      `<div id="lugemi-speech-${id}" data-lugemi-embed="${id}"></div>`,
      `<script async src="${webBase}/embed/player.js" data-lugemi-embed="${id}"></script>`,
    ].join('\n');

    return {
      product: 'lugemi_speech_embed',
      project,
      playerUrl,
      snippet,
      api: {
        public: `GET /v1/speech-embed/${id}`,
        audio: `POST /v1/speech-embed/${id}/audio`,
      },
    };
  }

  async getPublic(id: string) {
    const row = await this.prisma.cacheEntry.findFirst({
      where: { namespace: NAMESPACE, cacheKey: id },
    });
    if (!row) {
      throw new ApiException('not_found', 'Speech embed not found', HttpStatus.NOT_FOUND);
    }
    const project = row.valueJson as SpeechEmbedProject;
    return {
      product: 'lugemi_speech_embed',
      id: project.id,
      title: project.title,
      text: project.text,
      voice: project.voice,
      language: project.language ?? null,
      createdAt: project.createdAt,
      characters: [...project.text].length,
    };
  }

  async synthesizeAudio(input: {
    id: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const publicView = await this.getPublic(input.id);
    await this.billing.assertProductQuota(
      input.organizationId,
      'tts',
      Math.max(1, publicView.characters),
    );

    const out = await this.gateway.synthesize({
      text: publicView.text,
      voice: publicView.voice,
      language: publicView.language ?? undefined,
      format: 'mp3',
      requireIntelligible: true,
    });

    await this.usage.recordTts({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      characters: out.characters,
      provider: out.provider,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'speech_embed.audio',
      route: `POST /v1/speech-embed/${input.id}/audio`,
      ip: input.ip,
      metadata: { id: input.id, characters: out.characters, voice: out.voice },
    });

    return {
      audio: out.audio,
      mimeType: out.mimeType,
      format: out.format,
      characters: out.characters,
      voice: out.voice,
      provider: out.provider,
    };
  }
}

function publicWebBase(): string {
  return (
    process.env.LUGEMI_WEB_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'https://lugemi.ai'
  ).replace(/\/$/, '');
}

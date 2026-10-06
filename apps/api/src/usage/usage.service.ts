import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  recordTranslation(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    characters: number;
    provider: string;
    sourceLang: string;
    targetLang: string;
    latencyMs: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.translationRequest.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          characters: input.characters,
          provider: input.provider,
          latencyMs: input.latencyMs,
        },
      }),
      this.prisma.usageEvent.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          feature: 'translate',
          unitType: 'characters',
          units: input.characters,
          provider: input.provider,
        },
      }),
    ]);
  }

  recordStt(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    seconds: number;
    provider: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: 'stt',
        unitType: 'seconds',
        units: input.seconds,
        provider: input.provider,
      },
    });
  }

  recordTts(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    characters: number;
    provider: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: 'tts',
        unitType: 'characters',
        units: input.characters,
        provider: input.provider,
      },
    });
  }

  recordOcr(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    pages: number;
    provider: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: 'ocr',
        unitType: 'pages',
        units: input.pages,
        provider: input.provider,
      },
    });
  }

  recordChat(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    tokens: number;
    provider: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: 'chat',
        unitType: 'tokens',
        units: input.tokens,
        provider: input.provider,
      },
    });
  }

  recordEmbeddings(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    tokens: number;
    provider: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: 'embeddings',
        unitType: 'tokens',
        units: input.tokens,
        provider: input.provider,
      },
    });
  }

  async summary(organizationId: string) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const events = await this.prisma.usageEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: start },
      },
    });

    const translateEvents = events.filter((e) => e.feature === 'translate');
    const sttEvents = events.filter((e) => e.feature === 'stt');
    const ttsEvents = events.filter((e) => e.feature === 'tts');
    const ocrEvents = events.filter((e) => e.feature === 'ocr');
    const chatEvents = events.filter((e) => e.feature === 'chat');
    const embeddingEvents = events.filter((e) => e.feature === 'embeddings');
    const characters = translateEvents.reduce((sum, event) => sum + event.units, 0);
    const sttSeconds = sttEvents.reduce((sum, event) => sum + event.units, 0);
    const ttsCharacters = ttsEvents.reduce((sum, event) => sum + event.units, 0);
    const ocrPages = ocrEvents.reduce((sum, event) => sum + event.units, 0);
    const chatTokens = chatEvents.reduce((sum, event) => sum + event.units, 0);
    const embeddingTokens = embeddingEvents.reduce((sum, event) => sum + event.units, 0);

    return {
      periodStart: start.toISOString(),
      requests: translateEvents.length,
      characters,
      translate: {
        requests: translateEvents.length,
        characters,
      },
      stt: {
        requests: sttEvents.length,
        seconds: sttSeconds,
        minutes: Math.round((sttSeconds / 60) * 1000) / 1000,
      },
      tts: {
        requests: ttsEvents.length,
        characters: ttsCharacters,
      },
      ocr: {
        requests: ocrEvents.length,
        pages: ocrPages,
      },
      chat: {
        requests: chatEvents.length,
        tokens: chatTokens,
      },
      embeddings: {
        requests: embeddingEvents.length,
        tokens: embeddingTokens,
      },
    };
  }
}

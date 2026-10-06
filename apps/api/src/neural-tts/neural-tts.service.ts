import { Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AudioService } from '../audio/audio.service';
import { neuralTtsEngineCatalog } from './neural-tts.catalog';
import {
  enrichVoice,
  filterEnrichedVoices,
  VoiceListFilters,
  EnrichedTtsVoice,
} from './voice-enrichment';

const STREAM_CHUNK_BYTES = 8 * 1024;

export type SynthesizeInput = {
  text: string;
  voice: string;
  language?: string;
  format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

@Injectable
export class NeuralTtsService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly audio: AudioService,
  ) {}

  engine {
    return neuralTtsEngineCatalog;
  }

  async analytics(organizationId: string) {
    const summary = await this.usage.summary(organizationId);
    return {
      periodStart: summary.periodStart,
      tts: summary.tts,
      product: 'Lugemi Neural TTS',
      note: 'Usage metering for TTS characters. Full Voice Analytics = voice-analytics.',
      docs: '/docs/NEURAL_TTS.md',
    };
  }

  async listVoices(
    filters: VoiceListFilters = {},
    workspace?: { organizationId: string; workspaceId: string },
  ) {
    const stock = this.gateway.listVoices.map((v) => enrichVoice(v));
    const clones: EnrichedTtsVoice[] = [];
    if (workspace) {
      const rows = await this.prisma.voiceClone.findMany({
        where: {
          organizationId: workspace.organizationId,
          workspaceId: workspace.workspaceId,
          status: 'approved',
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      for (const row of rows) {
        clones.push(
          enrichVoice(
            {
              id: `clone:${row.id}`,
              name: row.name,
              gender: 'neutral',
              languages: ['en'],
              provider: 'vendor_clone',
            },
            { enterprise: true, category: 'clone' },
          ),
        );
      }
    }

    const data = filterEnrichedVoices([...stock, ...clones], filters);
    return {
      data,
      facets: {
        genders: ['male', 'female', 'neutral'],
        ageGroups: ['adult', 'child', 'unknown'],
        categories: ['stock', 'own', 'clone'],
        note:
          'Children voices are not available from current vendors (capability deferred). Dialect/accent tags are catalog metadata — not acoustic control knobs. Approved clones appear when authenticated.',
      },
      docs: '/docs/NEURAL_TTS.md',
    };
  }

  async synthesize(input: SynthesizeInput) {
    const result = await this.audio.speak({
      text: input.text,
      voice: input.voice,
      language: input.language,
      format: input.format,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'tts.synthesized',
      route: 'POST /v1/tts/synthesize',
      ip: input.ip,
      metadata: {
        provider: result.provider,
        voice: result.voice,
        characters: result.characters,
        format: result.format,
        bytes: result.audio.length,
        mode: 'batch',
        watermarkApplied: result.watermarkApplied,
      },
    });

    return result;
  }

  async *streamSynthesize(input: SynthesizeInput): AsyncGenerator<{
    event: 'meta' | 'audio' | 'done' | 'error';
    [key: string]: unknown;
  }> {
    try {
      const result = await this.audio.speak({
        text: input.text,
        voice: input.voice,
        language: input.language,
        format: input.format,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });

      yield {
        event: 'meta',
        provider: result.provider,
        voice: result.voice,
        characters: result.characters,
        format: result.format,
        mimeType: result.mimeType,
        bytes: result.audio.length,
        watermarkApplied: result.watermarkApplied,
        streaming: 'chunk_sse_after_synthesis',
        note: 'Audio is synthesized fully first, then delivered as SSE base64 chunks. Not vendor token streaming.',
      };

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
        action: 'tts.streamed',
        route: 'POST /v1/tts/stream',
        ip: input.ip,
        metadata: {
          provider: result.provider,
          voice: result.voice,
          characters: result.characters,
          format: result.format,
          bytes: result.audio.length,
          chunks: index,
          mode: 'chunk_sse',
          watermarkApplied: result.watermarkApplied,
        },
      });

      yield {
        event: 'done',
        chunks: index,
        bytes: result.audio.length,
        provider: result.provider,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'TTS stream failed';
      yield { event: 'error', message };
    }
  }
}

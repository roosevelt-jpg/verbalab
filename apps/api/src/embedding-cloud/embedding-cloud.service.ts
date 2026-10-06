import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ApiException } from '../common/errors/api-exception';
import {
  SUPPORTED_EMBED_MODALITIES,
  SupportedEmbedModality,
  embeddingCloudCatalog,
  embeddingModelsCatalog,
} from './embedding-cloud.catalog';

@Injectable()
export class EmbeddingCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  engine() {
    return embeddingCloudCatalog();
  }

  models() {
    return embeddingModelsCatalog();
  }

  modalities() {
    const c = embeddingCloudCatalog();
    return { modalities: c.modalities, note: c.note };
  }

  async embed(input: {
    input: unknown;
    model?: string;
    modality?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const modality = this.resolveModality(input.modality);
    const result = await this.embeddings.create({
      input: input.input,
      model: input.model,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });

    // Enrich last audit with modality when present (best-effort; create already audited).
    if (modality !== 'text') {
      await this.prisma.auditEvent.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: 'embedding_cloud.embed',
          route: 'POST /v1/embedding-cloud/embed',
          ip: input.ip,
          metadata: {
            modality,
            model: result.model,
            provider: result.provider,
            inputs: result.data.length,
            totalTokens: result.usage.total_tokens,
          },
        },
      });
    }

    return {
      ...result,
      modality,
      product: 'VerbaLab Embedding Cloud',
    };
  }

  async analytics(organizationId: string) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const [events, audits] = await Promise.all([
      this.prisma.usageEvent.findMany({
        where: {
          organizationId,
          feature: 'embeddings',
          createdAt: { gte: start },
        },
        select: { units: true, provider: true },
      }),
      this.prisma.auditEvent.findMany({
        where: {
          organizationId,
          action: { in: ['embeddings.created', 'embedding_cloud.embed'] },
          createdAt: { gte: start },
        },
        select: { metadata: true, action: true },
        take: 5000,
      }),
    ]);

    let tokens = 0;
    const byProvider: Record<string, number> = {};
    for (const e of events) {
      tokens += e.units;
      byProvider[e.provider] = (byProvider[e.provider] ?? 0) + e.units;
    }

    const byModality: Record<string, number> = {};
    let latencySum = 0;
    let latencySamples = 0;
    for (const a of audits) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      const modality =
        typeof meta.modality === 'string' && meta.modality ? meta.modality : 'text';
      byModality[modality] = (byModality[modality] ?? 0) + 1;
      if (typeof meta.latencyMs === 'number') {
        latencySum += meta.latencyMs;
        latencySamples += 1;
      }
    }

    return {
      periodStart: start.toISOString(),
      requests: events.length,
      tokens,
      byProvider,
      byModality: Object.entries(byModality)
        .map(([modality, count]) => ({ modality, count }))
        .sort((a, b) => b.count - a.count),
      averageLatencyMs: latencySamples
        ? Number((latencySum / latencySamples).toFixed(1))
        : null,
      note: 'Embedding Cloud analytics from usage_events + audits (VL-181).',
    };
  }

  async monitoring(organizationId: string) {
    const analytics = await this.analytics(organizationId);
    const engine = this.engine();
    return {
      generatedAt: new Date().toISOString(),
      periodStart: analytics.periodStart,
      requests: analytics.requests,
      tokens: analytics.tokens,
      averageLatencyMs: analytics.averageLatencyMs,
      deferredModalities: engine.modalities.filter((m) => m.status === 'deferred').map((m) => m.id),
      note: 'Embedding Cloud monitoring snapshot (VL-181).',
    };
  }

  private resolveModality(raw?: string): SupportedEmbedModality {
    if (raw === undefined || raw === null || raw === '') return 'text';
    if (typeof raw !== 'string') {
      throw new ApiException('validation_error', 'modality must be a string', HttpStatus.BAD_REQUEST);
    }
    const modality = raw.trim().toLowerCase();
    if ((SUPPORTED_EMBED_MODALITIES as readonly string[]).includes(modality)) {
      return modality as SupportedEmbedModality;
    }
    if (
      ['speech', 'voice', 'image', 'video', 'cross_modal', 'cross-modal', 'hybrid'].includes(
        modality,
      )
    ) {
      throw new ApiException(
        'validation_error',
        `modality '${modality}' is deferred — Embedding Cloud ships text/document/code only (VL-181)`,
        HttpStatus.BAD_REQUEST,
      );
    }
    throw new ApiException(
      'validation_error',
      `unsupported modality '${modality}' — use text, document, or code`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

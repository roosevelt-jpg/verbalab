import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import {
  MODEL_FEATURES,
  VENDOR_MODEL_SEEDS,
  envConfigured,
  isModelFeature,
  type ModelFeature,
} from './model-registry.seeds';

@Injectable()
export class ModelsService implements OnModuleInit {
  private readonly logger = new Logger(ModelsService.name);
  private seeded = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.ensureVendorDefaults();
  }

  async ensureVendorDefaults() {
    for (const seed of VENDOR_MODEL_SEEDS) {
      await this.prisma.modelRegistryEntry.upsert({
        where: { slug: seed.slug },
        create: {
          slug: seed.slug,
          displayName: seed.displayName,
          feature: seed.feature,
          kind: 'vendor',
          provider: seed.provider,
          baseModel: seed.baseModel,
          status: 'ready',
          notes: seed.notes,
          metricsJson: { role: seed.role ?? 'primary', envKey: seed.envKey },
        },
        update: {
          displayName: seed.displayName,
          feature: seed.feature,
          kind: 'vendor',
          provider: seed.provider,
          baseModel: seed.baseModel,
          notes: seed.notes,
          // Do not force status — admins may retire a vendor entry.
        },
      });
    }
    this.seeded = true;
    this.logger.log(
      JSON.stringify({ event: 'models.vendor_defaults_ensured', count: VENDOR_MODEL_SEEDS.length }),
    );
  }

  list(feature?: string) {
    return this.prisma.modelRegistryEntry.findMany({
      where: feature ? { feature } : undefined,
      orderBy: [{ feature: 'asc' }, { kind: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async get(idOrSlug: string) {
    const row = await this.prisma.modelRegistryEntry.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Model registry entry not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  /** Live matrix: ready models per feature + credential configured flags. */
  async liveMatrix() {
    if (!this.seeded) await this.ensureVendorDefaults();

    const ready = await this.prisma.modelRegistryEntry.findMany({
      where: { status: 'ready' },
      orderBy: [{ feature: 'asc' }, { kind: 'asc' }, { slug: 'asc' }],
    });

    const byFeature = MODEL_FEATURES.map((feature) => {
      const models = ready
        .filter((m) => m.feature === feature)
        .map((m) => {
          const seed = VENDOR_MODEL_SEEDS.find((s) => s.slug === m.slug);
          const configured =
            m.kind === 'vendor' ? envConfigured(seed?.envKey ?? null) : Boolean(m.artifactUri);
          return {
            id: m.id,
            slug: m.slug,
            displayName: m.displayName,
            kind: m.kind,
            provider: m.provider,
            baseModel: m.baseModel,
            sourceLang: m.sourceLang,
            targetLang: m.targetLang,
            artifactKind: m.artifactKind,
            externalUrl: m.externalUrl,
            notes: m.notes,
            configured,
            envKey: seed?.envKey ?? null,
          };
        });

      return {
        feature,
        models,
        hasConfiguredProvider: models.some((m) => m.configured),
      };
    });

    return {
      asOf: new Date().toISOString(),
      disclaimer:
        'Registry tracks which bought or fine-tuned adapters are marked ready per feature. Optional externalUrl links to W&B/vendor docs — this is not MLflow.',
      features: byFeature,
    };
  }

  async setExternalUrl(input: {
    idOrSlug: string;
    externalUrl: string | null;
    notes?: string;
    organizationId: string;
    actorUserId?: string;
    ip?: string;
  }) {
    const row = await this.get(input.idOrSlug);
    const url = input.externalUrl?.trim() || null;
    if (url && !/^https?:\/\//i.test(url)) {
      throw new ApiException(
        'validation_error',
        'externalUrl must be an http(s) URL (e.g. Weights & Biases run)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.modelRegistryEntry.update({
      where: { id: row.id },
      data: {
        externalUrl: url,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: 'models.external_url_set',
      route: `POST /v1/models/${row.id}/external-url`,
      ip: input.ip,
      metadata: { modelId: row.id, slug: row.slug, externalUrl: url },
    });

    return updated;
  }

  async setStatus(input: {
    idOrSlug: string;
    status: 'ready' | 'retired' | 'draft';
    organizationId: string;
    actorUserId?: string;
    ip?: string;
  }) {
    const row = await this.get(input.idOrSlug);
    if (!['ready', 'retired', 'draft'].includes(input.status)) {
      throw new ApiException(
        'validation_error',
        'status must be ready, retired, or draft',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Promoting a vendor primary for a feature retires other non-fallback vendor defaults.
    if (input.status === 'ready' && row.kind === 'vendor' && !row.sourceLang) {
      const metrics = row.metricsJson as { role?: string } | null;
      if (metrics?.role !== 'fallback') {
        await this.prisma.modelRegistryEntry.updateMany({
          where: {
            feature: row.feature,
            kind: 'vendor',
            status: 'ready',
            id: { not: row.id },
            sourceLang: null,
            slug: { not: 'vendor-detect-franc' },
          },
          data: { status: 'retired' },
        });
      }
    }

    const updated = await this.prisma.modelRegistryEntry.update({
      where: { id: row.id },
      data: { status: input.status },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: 'models.status_set',
      route: `POST /v1/models/${row.id}/status`,
      ip: input.ip,
      metadata: { modelId: row.id, slug: row.slug, status: input.status },
    });

    return updated;
  }

  assertFeature(feature: string): ModelFeature {
    if (!isModelFeature(feature)) {
      throw new ApiException(
        'validation_error',
        `feature must be one of: ${MODEL_FEATURES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return feature;
  }
}

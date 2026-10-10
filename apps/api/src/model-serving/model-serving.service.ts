import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  modelServingCatalog,
  modelServingCeilings,
  modelServingMode,
  servingModelKinds,
  servingModes,
  type ServingModelKind,
} from './model-serving.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

const KIND_IDS = new Set(servingModelKinds().map((k) => k.id));

@Injectable()
export class ModelServingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    const ceilings = modelServingCeilings();
    return {
      ...modelServingCatalog(),
      ceilings,
      spendSafety: {
        hardSpendCeilingsRequired: true,
        note:
          'Model Serving does not provision GPUs. GPU spend ceilings live on GPU Platform. Cost Optimization must enforce caps.',
      },
    };
  }

  kinds() {
    return {
      kinds: servingModelKinds(),
      honesty: modelServingCatalog().honesty,
    };
  }

  modes() {
    return {
      modes: servingModes(),
      honesty: modelServingCatalog().honesty,
    };
  }

  ceilings() {
    return modelServingCeilings();
  }

  async endpoints(kind?: string) {
    const kinds = servingModelKinds().filter((k) =>
      kind ? k.id === kind.toLowerCase() : true,
    );
    const features = [...new Set(kinds.flatMap((k) => k.registryFeatures))];
    const registry =
      features.length === 0
        ? []
        : await this.prisma.modelRegistryEntry.findMany({
            where: {
              status: 'ready',
              feature: { in: features },
            },
            orderBy: [{ feature: 'asc' }, { slug: 'asc' }],
            take: 200,
          });

    const endpoints = kinds.flatMap((k) =>
      k.gatewayApis.map((api) => ({
        kind: k.id,
        kindName: k.name,
        status: k.status,
        api,
        registryModels: registry
          .filter((r) => k.registryFeatures.includes(r.feature))
          .map((r) => ({
            id: r.id,
            slug: r.slug,
            displayName: r.displayName,
            feature: r.feature,
            provider: r.provider,
            baseModel: r.baseModel,
          })),
        notes: k.notes,
      })),
    );

    return {
      endpoints,
      note: 'Discoverable Gateway + registry map — traffic still goes through AI Gateway adapters.',
      honesty: modelServingCatalog().honesty,
    };
  }

  async listDeployments(input: AuthCtx & { status?: string; kind?: string }) {
    const rows = await this.prisma.modelServingDeployment.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        ...(input.status ? { status: input.status } : {}),
        ...(input.kind ? { kind: input.kind.toLowerCase() } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      deployments: rows.map((r) => this.serialize(r)),
      note: 'Org/workspace-scoped sandbox deployments.',
    };
  }

  async deploy(
    input: AuthCtx & {
      kind?: string;
      modelSlug?: string;
      version?: string;
      strategy?: string;
      trafficPercent?: number;
      slot?: string;
      label?: string;
    },
  ) {
    if (modelServingMode() === 'disabled') {
      throw new ApiException(
        'model_serving_disabled',
        'Model Serving mode is disabled (LUGEMI_MODEL_SERVING_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }

    const kind = (input.kind ?? '').trim().toLowerCase() as ServingModelKind;
    if (!KIND_IDS.has(kind)) {
      throw new ApiException(
        'validation_error',
        'kind must be one of llm|speech|voice|ocr|embedding|vision|reasoning',
        HttpStatus.BAD_REQUEST,
      );
    }
    const kindMeta = servingModelKinds().find((k) => k.id === kind)!;
    if (kindMeta.status === 'deferred') {
      throw new ApiException(
        'validation_error',
        `Serving kind "${kind}" is deferred`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const modelSlug = (input.modelSlug ?? '').trim();
    if (!modelSlug) {
      throw new ApiException(
        'validation_error',
        'modelSlug is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const model = await this.prisma.modelRegistryEntry.findFirst({
      where: {
        OR: [{ slug: modelSlug }, { id: modelSlug }],
        status: 'ready',
      },
    });
    if (!model) {
      throw new ApiException(
        'not_found',
        'Model registry entry not found or not ready',
        HttpStatus.NOT_FOUND,
      );
    }
    if (
      kindMeta.registryFeatures.length > 0 &&
      !kindMeta.registryFeatures.includes(model.feature)
    ) {
      throw new ApiException(
        'validation_error',
        `Model feature "${model.feature}" does not match kind "${kind}" (expected ${kindMeta.registryFeatures.join(',')})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const ceilings = modelServingCeilings();
    const activeCount = await this.prisma.modelServingDeployment.count({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        status: { in: ['active', 'canary', 'blue', 'green'] },
      },
    });
    if (activeCount >= ceilings.maxActiveDeployments) {
      throw new ApiException(
        'model_serving_ceiling',
        `Hard active-deployment ceiling exceeded: ${activeCount} >= maxActiveDeployments ${ceilings.maxActiveDeployments}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const strategy = this.normalizeStrategy(input.strategy);
    const trafficPercent = this.clampTraffic(input.trafficPercent, strategy);
    const slot = this.normalizeSlot(input.slot, strategy);
    const version = (input.version ?? 'v1').trim().slice(0, 64) || 'v1';
    const status =
      strategy === 'canary' ? 'canary' : slot === 'green' ? 'green' : 'active';

    const row = await this.prisma.modelServingDeployment.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        kind,
        modelSlug: model.slug,
        modelId: model.id,
        version,
        strategy,
        trafficPercent,
        slot,
        status,
        label: (input.label ?? '').slice(0, 200),
        previousVersion: null,
        metadata: {
          sandboxLogicalOnly: true,
          gatewayApis: kindMeta.gatewayApis,
          provider: model.provider,
          baseModel: model.baseModel,
        },
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'model_serving.deployed',
      route: 'POST /v1/model-serving/deployments',
      ip: input.ip,
      metadata: {
        id: row.id,
        kind,
        modelSlug: model.slug,
        version,
        strategy,
        trafficPercent,
      },
    });

    return {
      deployment: this.serialize(row),
      ceilings,
      note: 'Sandbox logical deployment recorded — inference still routes through AI Gateway.',
      honesty: modelServingCatalog().honesty,
    };
  }

  async setTraffic(
    input: AuthCtx & { id: string; trafficPercent?: number },
  ) {
    this.assertEnabled();
    const row = await this.requireDeployment(input);
    if (!['active', 'canary', 'blue', 'green'].includes(row.status)) {
      throw new ApiException(
        'validation_error',
        'Only active/canary/blue/green deployments accept traffic changes',
        HttpStatus.BAD_REQUEST,
      );
    }
    const trafficPercent = this.clampTraffic(
      input.trafficPercent,
      row.strategy,
    );
    const updated = await this.prisma.modelServingDeployment.update({
      where: { id: row.id },
      data: {
        trafficPercent,
        status: trafficPercent < 100 && row.strategy === 'canary' ? 'canary' : row.status,
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'model_serving.traffic',
      route: 'POST /v1/model-serving/deployments/:id/traffic',
      ip: input.ip,
      metadata: { id: row.id, trafficPercent },
    });
    return {
      deployment: this.serialize(updated),
      note: 'Sandbox traffic percent updated — not a service-mesh canary.',
    };
  }

  async promote(input: AuthCtx & { id: string }) {
    this.assertEnabled();
    const row = await this.requireDeployment(input);
    if (!['canary', 'blue', 'green', 'active'].includes(row.status)) {
      throw new ApiException(
        'validation_error',
        'Deployment cannot be promoted from current status',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Blue/green: swap sibling slot to standby; promote this to active@100.
    if (row.strategy === 'blue_green') {
      const siblingSlot = row.slot === 'green' ? 'blue' : 'green';
      await this.prisma.modelServingDeployment.updateMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          kind: row.kind,
          modelSlug: row.modelSlug,
          slot: siblingSlot,
          status: { in: ['active', 'blue', 'green'] },
          NOT: { id: row.id },
        },
        data: { status: 'standby', trafficPercent: 0 },
      });
    } else if (row.strategy === 'canary') {
      // Promote canary → full traffic; demote other canaries for same model.
      await this.prisma.modelServingDeployment.updateMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          kind: row.kind,
          modelSlug: row.modelSlug,
          status: 'canary',
          NOT: { id: row.id },
        },
        data: { status: 'standby', trafficPercent: 0 },
      });
    }

    const updated = await this.prisma.modelServingDeployment.update({
      where: { id: row.id },
      data: {
        status: 'active',
        trafficPercent: 100,
        slot: row.strategy === 'blue_green' ? 'blue' : row.slot,
        metadata: {
          ...((row.metadata as object) ?? {}),
          promotedAt: new Date().toISOString(),
        },
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'model_serving.promoted',
      route: 'POST /v1/model-serving/deployments/:id/promote',
      ip: input.ip,
      metadata: { id: row.id },
    });

    return {
      deployment: this.serialize(updated),
      note: 'Promoted sandbox deployment to active@100% — not a Kubernetes blue/green controller.',
    };
  }

  async rollback(input: AuthCtx & { id: string }) {
    this.assertEnabled();
    const row = await this.requireDeployment(input);
    const previousVersion = row.previousVersion;
    if (!previousVersion) {
      // Look for a prior version of same model/kind to activate.
      const prior = await this.prisma.modelServingDeployment.findFirst({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          kind: row.kind,
          modelSlug: row.modelSlug,
          NOT: { id: row.id },
          status: { in: ['standby', 'released', 'active', 'canary', 'blue', 'green'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!prior) {
        throw new ApiException(
          'validation_error',
          'No previous version available to roll back to',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.prisma.modelServingDeployment.update({
        where: { id: row.id },
        data: {
          status: 'standby',
          trafficPercent: 0,
          previousVersion: row.version,
        },
      });
      const restored = await this.prisma.modelServingDeployment.update({
        where: { id: prior.id },
        data: {
          status: 'active',
          trafficPercent: 100,
          previousVersion: row.version,
        },
      });
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'model_serving.rollback',
        route: 'POST /v1/model-serving/deployments/:id/rollback',
        ip: input.ip,
        metadata: { from: row.id, to: prior.id, version: prior.version },
      });
      return {
        deployment: this.serialize(restored),
        rolledBackFrom: this.serialize({ ...row, status: 'standby', trafficPercent: 0 }),
        note: 'Sandbox rollback activated prior version record.',
      };
    }

    // Explicit previousVersion pointer: spawn/activate matching version if present.
    const target = await this.prisma.modelServingDeployment.findFirst({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        kind: row.kind,
        modelSlug: row.modelSlug,
        version: previousVersion,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!target) {
      throw new ApiException(
        'not_found',
        `Previous version ${previousVersion} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.prisma.modelServingDeployment.update({
      where: { id: row.id },
      data: { status: 'standby', trafficPercent: 0 },
    });
    const restored = await this.prisma.modelServingDeployment.update({
      where: { id: target.id },
      data: {
        status: 'active',
        trafficPercent: 100,
        previousVersion: row.version,
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'model_serving.rollback',
      route: 'POST /v1/model-serving/deployments/:id/rollback',
      ip: input.ip,
      metadata: { from: row.id, to: target.id, version: previousVersion },
    });
    return {
      deployment: this.serialize(restored),
      note: 'Sandbox rollback to previousVersion.',
    };
  }

  async release(input: AuthCtx & { id: string }) {
    const row = await this.requireDeployment(input);
    const updated = await this.prisma.modelServingDeployment.update({
      where: { id: row.id },
      data: { status: 'released', trafficPercent: 0 },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'model_serving.released',
      route: 'POST /v1/model-serving/deployments/:id/release',
      ip: input.ip,
      metadata: { id: row.id },
    });
    return {
      deployment: this.serialize(updated),
      note: 'Sandbox deployment released.',
    };
  }

  /** Deploy a new version that remembers the current active as previous. */
  async redeployVersion(
    input: AuthCtx & {
      id: string;
      version?: string;
      trafficPercent?: number;
    },
  ) {
    this.assertEnabled();
    const row = await this.requireDeployment(input);
    const newVersion = (input.version ?? `${row.version}-next`).trim().slice(0, 64);
    const created = await this.deploy({
      ...input,
      kind: row.kind,
      modelSlug: row.modelSlug,
      version: newVersion,
      strategy: row.strategy,
      trafficPercent: input.trafficPercent ?? (row.strategy === 'canary' ? 10 : 100),
      slot: row.slot === 'blue' ? 'green' : 'blue',
      label: row.label,
    });
    await this.prisma.modelServingDeployment.update({
      where: { id: created.deployment.id },
      data: { previousVersion: row.version },
    });
    const fresh = await this.prisma.modelServingDeployment.findUniqueOrThrow({
      where: { id: created.deployment.id },
    });
    return {
      deployment: this.serialize(fresh),
      previous: this.serialize(row),
      note: 'New sandbox version created with previousVersion pointer.',
    };
  }

  async health(input: AuthCtx) {
    const active = await this.prisma.modelServingDeployment.count({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        status: { in: ['active', 'canary', 'blue', 'green'] },
      },
    });
    return {
      status: modelServingMode() === 'disabled' ? 'disabled' : 'sandbox_ok',
      activeDeployments: active,
      ceilings: modelServingCeilings(),
      kindsReady: servingModelKinds().filter((k) => k.status !== 'deferred').length,
      note: 'Sandbox health — not vendor serving telemetry.',
      honesty: modelServingCatalog().honesty,
    };
  }

  async analytics(input: AuthCtx) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, active, canary, released, audits] = await Promise.all([
      this.prisma.modelServingDeployment.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      }),
      this.prisma.modelServingDeployment.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'active',
        },
      }),
      this.prisma.modelServingDeployment.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'canary',
        },
      }),
      this.prisma.modelServingDeployment.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'released',
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId: input.organizationId,
          action: { startsWith: 'model_serving.' },
          createdAt: { gte: since },
        },
      }),
    ]);
    return {
      workspace: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      deploymentsTotal: total,
      active,
      canary,
      released,
      auditsLast30d: audits,
      note: 'Model Serving analytics. ≠ AI Runtime Analytics.',
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, health, analytics] = await Promise.all([
      Promise.resolve(this.engine()),
      this.health(input),
      this.analytics(input),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      health,
      analytics,
      honesty: engine.honesty,
      spendSafety: engine.spendSafety,
      deferred: engine.capabilities
        .filter((c) => c.status === 'deferred')
        .map((c) => c.id),
      note: 'Model Serving monitoring snapshot.',
    };
  }

  private assertEnabled() {
    if (modelServingMode() === 'disabled') {
      throw new ApiException(
        'model_serving_disabled',
        'Model Serving mode is disabled',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async requireDeployment(input: AuthCtx & { id: string }) {
    const row = await this.prisma.modelServingDeployment.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException(
        'not_found',
        'Model serving deployment not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  private normalizeStrategy(raw?: string) {
    const s = (raw ?? 'rolling').toLowerCase();
    if (s === 'canary' || s === 'blue_green' || s === 'rolling') return s;
    throw new ApiException(
      'validation_error',
      'strategy must be rolling|canary|blue_green',
      HttpStatus.BAD_REQUEST,
    );
  }

  private normalizeSlot(raw: string | undefined, strategy: string) {
    if (strategy !== 'blue_green') return 'none';
    const s = (raw ?? 'blue').toLowerCase();
    if (s === 'blue' || s === 'green') return s;
    throw new ApiException(
      'validation_error',
      'slot must be blue|green for blue_green strategy',
      HttpStatus.BAD_REQUEST,
    );
  }

  private clampTraffic(raw: number | undefined, strategy: string) {
    if (raw === undefined || raw === null) {
      return strategy === 'canary' ? 10 : 100;
    }
    return Math.min(100, Math.max(0, Math.floor(raw)));
  }

  private serialize(r: {
    id: string;
    organizationId: string;
    workspaceId: string;
    kind: string;
    modelSlug: string;
    modelId: string;
    version: string;
    strategy: string;
    trafficPercent: number;
    slot: string;
    status: string;
    label: string;
    previousVersion: string | null;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: r.id,
      organizationId: r.organizationId,
      workspaceId: r.workspaceId,
      kind: r.kind,
      modelSlug: r.modelSlug,
      modelId: r.modelId,
      version: r.version,
      strategy: r.strategy,
      trafficPercent: r.trafficPercent,
      slot: r.slot,
      status: r.status,
      label: r.label,
      previousVersion: r.previousVersion,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}

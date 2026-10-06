import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { CostOptimizationService } from '../cost-optimization/cost-optimization.service';
import {
  ROUTER_FEATURES,
  STREAMING_FEATURES,
  aiRouterCatalog,
  aiRouterMode,
  defaultRouterPolicy,
  hydrateCandidates,
  routerFeatureRoutes,
  type RouterCandidate,
  type RouterFeature,
  type RouterOptimize,
} from './ai-router.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

@Injectable()
export class AiRouterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly cost: CostOptimizationService,
  ) {}

  engine() {
    return {
      ...aiRouterCatalog(),
      mode: aiRouterMode(),
      defaults: defaultRouterPolicy(),
      spendSafety: {
        hardSpendCeilingsRequired: true,
        enforcesSpendCaps: true,
        costOptimizationApi: 'GET /v1/cost-optimization/engine',
        note:
          'Resolve gates via Cost Optimization hard daily/monthly caps (402 when over). Router honesty.enforcesSpendCaps remains false (ledger lives in Cost Opt). GPU ceilings remain on GPU Platform.',
      },
    };
  }

  features() {
    return {
      features: routerFeatureRoutes().map((r) => ({
        feature: r.feature,
        gatewayApi: r.gatewayApi,
        candidateCount: r.candidates.length,
        streamingCapable: STREAMING_FEATURES.has(r.feature),
      })),
      honesty: aiRouterCatalog().honesty,
    };
  }

  providers() {
    const byProvider = new Map<
      string,
      { providerId: string; features: string[]; candidates: number }
    >();
    for (const route of routerFeatureRoutes()) {
      for (const c of hydrateCandidates(route.candidates, route.feature)) {
        const cur = byProvider.get(c.providerId) ?? {
          providerId: c.providerId,
          features: [],
          candidates: 0,
        };
        if (!cur.features.includes(route.feature)) cur.features.push(route.feature);
        cur.candidates += 1;
        byProvider.set(c.providerId, cur);
      }
    }
    return {
      providers: [...byProvider.values()],
      note: 'Gateway provider IDs — not a new vendor mesh.',
      honesty: aiRouterCatalog().honesty,
    };
  }

  async getPolicy(input: AuthCtx) {
    const row = await this.prisma.aiRouterPolicy.findUnique({
      where: {
        organizationId_workspaceId: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      },
    });
    const defaults = defaultRouterPolicy();
    if (!row) {
      return {
        policy: {
          ...defaults,
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          preferProvider: null,
          persisted: false,
        },
        note: 'Using defaults — no persisted workspace policy.',
      };
    }
    return {
      policy: {
        organizationId: row.organizationId,
        workspaceId: row.workspaceId,
        optimize: row.optimize as RouterOptimize,
        maxRetries: row.maxRetries,
        preferRegion: row.preferRegion,
        allowFallback: row.allowFallback,
        preferConfiguredOnly: row.preferConfiguredOnly,
        streamingPreferred: row.streamingPreferred,
        preferProvider: row.preferProvider || null,
        persisted: true,
        updatedAt: row.updatedAt.toISOString(),
      },
      note: 'Org/workspace-scoped router policy.',
    };
  }

  async upsertPolicy(
    input: AuthCtx & {
      optimize?: string;
      maxRetries?: number;
      preferRegion?: string;
      allowFallback?: boolean;
      preferConfiguredOnly?: boolean;
      streamingPreferred?: boolean;
      preferProvider?: string | null;
    },
  ) {
    if (aiRouterMode() === 'disabled') {
      throw new ApiException(
        'ai_router_disabled',
        'AI Router mode is disabled (LUGEMI_AI_ROUTER_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
    const optimize = this.normalizeOptimize(input.optimize ?? 'balanced');
    const maxRetries = Math.min(3, Math.max(0, Math.floor(input.maxRetries ?? 1)));
    const preferRegion = (input.preferRegion ?? 'af-south-1').trim().slice(0, 64) || 'af-south-1';
    const row = await this.prisma.aiRouterPolicy.upsert({
      where: {
        organizationId_workspaceId: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      },
      create: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        optimize,
        maxRetries,
        preferRegion,
        allowFallback: input.allowFallback ?? true,
        preferConfiguredOnly: input.preferConfiguredOnly ?? true,
        streamingPreferred: input.streamingPreferred ?? false,
        preferProvider: (input.preferProvider ?? '').slice(0, 64),
      },
      update: {
        optimize,
        maxRetries,
        preferRegion,
        allowFallback: input.allowFallback ?? true,
        preferConfiguredOnly: input.preferConfiguredOnly ?? true,
        streamingPreferred: input.streamingPreferred ?? false,
        preferProvider: (input.preferProvider ?? '').slice(0, 64),
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'ai_router.policy_upserted',
      route: 'PUT /v1/ai-router/policies',
      ip: input.ip,
      metadata: { optimize, maxRetries, preferRegion },
    });
    return this.getPolicy(input).then((p) => ({
      ...p,
      policy: { ...p.policy, id: row.id },
    }));
  }

  async resolve(
    input: AuthCtx & {
      feature?: string;
      optimize?: string;
      preferProvider?: string;
      preferRegion?: string;
      allowFallback?: boolean;
      streaming?: boolean;
      dryRun?: boolean;
    },
  ) {
    if (aiRouterMode() === 'disabled') {
      throw new ApiException(
        'ai_router_disabled',
        'AI Router mode is disabled',
        HttpStatus.FORBIDDEN,
      );
    }

    const feature = (input.feature ?? 'chat').trim().toLowerCase() as RouterFeature;
    if (!ROUTER_FEATURES.includes(feature)) {
      throw new ApiException(
        'validation_error',
        `feature must be one of ${ROUTER_FEATURES.join('|')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const policyRes = await this.getPolicy(input);
    const policy = policyRes.policy;
    const optimize = this.normalizeOptimize(input.optimize ?? policy.optimize);
    const preferRegion = (input.preferRegion ?? policy.preferRegion).trim();
    const allowFallback = input.allowFallback ?? policy.allowFallback;
    const preferProvider = (
      input.preferProvider ??
      policy.preferProvider ??
      ''
    )
      .trim()
      .toLowerCase();
    const preferConfiguredOnly = policy.preferConfiguredOnly !== false;

    const route = routerFeatureRoutes().find((r) => r.feature === feature)!;
    let candidates = hydrateCandidates(route.candidates, feature);

    // Blend Model Serving canary weights when present.
    const deployments = await this.prisma.modelServingDeployment.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        status: { in: ['active', 'canary', 'blue', 'green'] },
      },
      take: 50,
    });
    candidates = candidates.map((c) => {
      const dep = deployments.find((d) => d.modelSlug === c.modelSlug);
      if (!dep) return c;
      return {
        ...c,
        role: dep.status === 'canary' ? 'canary' : c.role,
        weight: dep.trafficPercent > 0 ? dep.trafficPercent : c.weight,
        notes: `${c.notes} Serving deployment ${dep.version}@${dep.trafficPercent}%.`,
      };
    });

    let ranked = [...candidates];
    if (preferConfiguredOnly) {
      const configured = ranked.filter((c) => c.configured);
      if (configured.length > 0) ranked = configured;
    }

    ranked = this.sortCandidates(ranked, optimize, preferRegion, preferProvider);

    if (!allowFallback && ranked.length > 1) {
      ranked = ranked.slice(0, 1);
    }

    if (ranked.length === 0) {
      throw new ApiException(
        'no_route',
        `No router candidates available for feature=${feature}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const selected = ranked[0]!;
    const chain = ranked.map((c, i) => ({
      order: i + 1,
      ...c,
    }));

    // Hard spend gate via Cost Optimization — refuse when already over caps.
    const spendGate = await this.cost.assertWithinCaps({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      additionalUsd: selected.estimatedCostPer1kUsd,
    });

    const decision = {
      feature,
      gatewayApi: route.gatewayApi,
      optimize,
      selected: {
        providerId: selected.providerId,
        modelSlug: selected.modelSlug,
        role: selected.role,
        estimatedLatencyMs: selected.estimatedLatencyMs,
        estimatedCostPer1kUsd: selected.estimatedCostPer1kUsd,
        region: selected.region,
        configured: selected.configured,
      },
      chain,
      retries: {
        maxRetries: policy.maxRetries,
        note: 'Advisory — Gateway owns actual HTTP retries today.',
      },
      streaming: {
        requested: Boolean(input.streaming ?? policy.streamingPreferred),
        capable: STREAMING_FEATURES.has(feature),
        note: STREAMING_FEATURES.has(feature)
          ? 'Feature supports SSE where wired; dedicated Streaming Runtime is .'
          : 'Feature is request/response today.',
      },
      caching: {
        enabled: false,
        note: 'Opt-in via Intelligent Cache — resolve does not auto-cache.',
        api: 'GET /v1/intelligent-cache/engine',
      },
      spendGate: {
        allowed: spendGate.allowed,
        enforce: spendGate.enforce,
        api: 'GET /v1/cost-optimization/engine',
        note: 'Hard caps enforced by Cost Optimization.',
      },
      loadBalancing: {
        strategy: 'weighted_static',
        note: 'Weights from catalog + Model Serving trafficPercent — not live L7 LB.',
      },
      regional: {
        preferRegion,
        primaryRegion: 'af-south-1',
        multiRegionMesh: false,
      },
      dryRun: input.dryRun !== false,
      honesty: aiRouterCatalog().honesty,
      note: 'Dry-run route plan — does not invoke the provider. Call Gateway APIs to execute. Spend caps enforced via existing.',
    };

    const row = await this.prisma.aiRouterDecision.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        feature,
        optimize,
        selectedProvider: selected.providerId,
        selectedModel: selected.modelSlug ?? '',
        chainJson: chain,
        metadata: {
          dryRun: decision.dryRun,
          preferRegion,
          allowFallback,
          servingDeploymentsConsidered: deployments.length,
        },
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'ai_router.resolved',
      route: 'POST /v1/ai-router/resolve',
      ip: input.ip,
      metadata: {
        id: row.id,
        feature,
        optimize,
        selectedProvider: selected.providerId,
        selectedModel: selected.modelSlug,
      },
    });

    return {
      decisionId: row.id,
      ...decision,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listDecisions(input: AuthCtx & { feature?: string }) {
    const rows = await this.prisma.aiRouterDecision.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        ...(input.feature ? { feature: input.feature.toLowerCase() } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      decisions: rows.map((r) => ({
        id: r.id,
        feature: r.feature,
        optimize: r.optimize,
        selectedProvider: r.selectedProvider,
        selectedModel: r.selectedModel,
        createdAt: r.createdAt.toISOString(),
      })),
      note: 'Recent dry-run route decisions.',
    };
  }

  async analytics(input: AuthCtx) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, byFeature, audits] = await Promise.all([
      this.prisma.aiRouterDecision.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      }),
      this.prisma.aiRouterDecision.groupBy({
        by: ['feature'],
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          createdAt: { gte: since },
        },
        _count: true,
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId: input.organizationId,
          action: { startsWith: 'ai_router.' },
          createdAt: { gte: since },
        },
      }),
    ]);
    return {
      workspace: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      decisionsTotal: total,
      byFeatureLast30d: byFeature.map((r) => ({
        feature: r.feature,
        count: r._count,
      })),
      auditsLast30d: audits,
      note: 'AI Router analytics. ≠ AI Runtime Analytics.',
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, analytics, policy] = await Promise.all([
      Promise.resolve(this.engine()),
      this.analytics(input),
      this.getPolicy(input),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      mode: aiRouterMode(),
      policy: policy.policy,
      analytics,
      honesty: engine.honesty,
      spendSafety: engine.spendSafety,
      deferred: engine.capabilities
        .filter((c) => (c.status as string) === 'deferred')
        .map((c) => c.id),
      note: 'AI Router monitoring snapshot.',
    };
  }

  private normalizeOptimize(raw: string): RouterOptimize {
    const s = raw.toLowerCase();
    if (s === 'latency' || s === 'cost' || s === 'balanced' || s === 'quality') return s;
    throw new ApiException(
      'validation_error',
      'optimize must be latency|cost|balanced|quality',
      HttpStatus.BAD_REQUEST,
    );
  }

  private sortCandidates(
    candidates: RouterCandidate[],
    optimize: RouterOptimize,
    preferRegion: string,
    preferProvider: string,
  ): RouterCandidate[] {
    return [...candidates].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (preferProvider) {
        if (a.providerId === preferProvider) scoreA += 50;
        if (b.providerId === preferProvider) scoreB += 50;
      }
      if (a.region === preferRegion) scoreA += 10;
      if (b.region === preferRegion) scoreB += 10;
      if (a.role === 'primary') scoreA += 5;
      if (b.role === 'primary') scoreB += 5;
      scoreA += a.weight / 100;
      scoreB += b.weight / 100;

      if (optimize === 'latency') {
        scoreA += (2000 - a.estimatedLatencyMs) / 200;
        scoreB += (2000 - b.estimatedLatencyMs) / 200;
      } else if (optimize === 'cost') {
        scoreA += (0.05 - a.estimatedCostPer1kUsd) * 200;
        scoreB += (0.05 - b.estimatedCostPer1kUsd) * 200;
      } else if (optimize === 'quality') {
        // Prefer primary/configured higher-cost as proxy for quality.
        scoreA += a.estimatedCostPer1kUsd * 100 + (a.role === 'primary' ? 8 : 0);
        scoreB += b.estimatedCostPer1kUsd * 100 + (b.role === 'primary' ? 8 : 0);
      } else {
        // balanced
        scoreA += (2000 - a.estimatedLatencyMs) / 400 + (0.05 - a.estimatedCostPer1kUsd) * 80;
        scoreB += (2000 - b.estimatedLatencyMs) / 400 + (0.05 - b.estimatedCostPer1kUsd) * 80;
      }

      return scoreB - scoreA;
    });
  }
}

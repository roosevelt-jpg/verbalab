import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { gpuCeilings } from '../gpu-platform/gpu-platform.catalog';
import {
  hydrateCandidates,
  routerFeatureRoutes,
  type RouterFeature,
  ROUTER_FEATURES,
} from '../ai-router/ai-router.catalog';
import {
  COST_SPEND_CATEGORIES,
  costCeilings,
  costOptimizationCatalog,
  costOptimizationMode,
  type CostSpendCategory,
} from './cost-optimization.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

type BudgetView = {
  organizationId: string;
  workspaceId: string;
  dailyCapUsd: number;
  monthlyCapUsd: number;
  enforce: boolean;
  preferSpot: boolean;
  reservedCapacityUnits: number;
  optimizeRouting: boolean;
  persisted: boolean;
  updatedAt?: string;
};

@Injectable()
export class CostOptimizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...costOptimizationCatalog(),
      ceilings: costCeilings(),
      mode: costOptimizationMode(),
      spendSafety: {
        hardSpendCeilingsRequired: true,
        enforcesSpendCaps: true,
        reportOnly: false,
        note:
          'Hard daily/monthly caps enforced on record/check and AI Router resolve. Do not connect to a production cloud billing account without these caps. GPU instance ceilings remain on VL-205.',
      },
    };
  }

  ceilings() {
    return costCeilings();
  }

  async getBudget(input: AuthCtx): Promise<{ budget: BudgetView; note: string }> {
    const ceilings = costCeilings();
    const row = await this.prisma.costBudget.findUnique({
      where: {
        organizationId_workspaceId: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      },
    });
    if (!row) {
      return {
        budget: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          dailyCapUsd: ceilings.defaultDailyCapUsd,
          monthlyCapUsd: ceilings.defaultMonthlyCapUsd,
          enforce: ceilings.enforceByDefault,
          preferSpot: true,
          reservedCapacityUnits: 0,
          optimizeRouting: true,
          persisted: false,
        },
        note: 'Using env default ceilings — no persisted workspace budget.',
      };
    }
    return {
      budget: {
        organizationId: row.organizationId,
        workspaceId: row.workspaceId,
        dailyCapUsd: row.dailyCapUsd,
        monthlyCapUsd: row.monthlyCapUsd,
        enforce: row.enforce,
        preferSpot: row.preferSpot,
        reservedCapacityUnits: row.reservedCapacityUnits,
        optimizeRouting: row.optimizeRouting,
        persisted: true,
        updatedAt: row.updatedAt.toISOString(),
      },
      note: 'Org/workspace-scoped cost budget with hard enforce flag.',
    };
  }

  async upsertBudget(
    input: AuthCtx & {
      dailyCapUsd?: number;
      monthlyCapUsd?: number;
      enforce?: boolean;
      preferSpot?: boolean;
      reservedCapacityUnits?: number;
      optimizeRouting?: boolean;
    },
  ) {
    this.assertEnabled();
    const ceilings = costCeilings();
    const dailyCapUsd = this.clampCap(
      input.dailyCapUsd ?? ceilings.defaultDailyCapUsd,
      ceilings.maxDailyCapUsd,
    );
    const monthlyCapUsd = this.clampCap(
      input.monthlyCapUsd ?? ceilings.defaultMonthlyCapUsd,
      ceilings.maxMonthlyCapUsd,
    );
    if (monthlyCapUsd < dailyCapUsd) {
      throw new ApiException(
        'validation_error',
        'monthlyCapUsd must be >= dailyCapUsd',
        HttpStatus.BAD_REQUEST,
      );
    }
    const reservedCapacityUnits = Math.min(
      100,
      Math.max(0, Math.floor(input.reservedCapacityUnits ?? 0)),
    );
    const row = await this.prisma.costBudget.upsert({
      where: {
        organizationId_workspaceId: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      },
      create: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        dailyCapUsd,
        monthlyCapUsd,
        enforce: input.enforce ?? true,
        preferSpot: input.preferSpot ?? true,
        reservedCapacityUnits,
        optimizeRouting: input.optimizeRouting ?? true,
      },
      update: {
        dailyCapUsd,
        monthlyCapUsd,
        enforce: input.enforce ?? true,
        preferSpot: input.preferSpot ?? true,
        reservedCapacityUnits,
        optimizeRouting: input.optimizeRouting ?? true,
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'cost_optimization.budget_upserted',
      route: 'PUT /v1/cost-optimization/budgets',
      ip: input.ip,
      metadata: { dailyCapUsd, monthlyCapUsd, enforce: row.enforce },
    });
    return this.getBudget(input);
  }

  async spendSummary(input: AuthCtx) {
    const { budget } = await this.getBudget(input);
    const now = new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [dailyAgg, monthlyAgg, byCategory] = await Promise.all([
      this.prisma.costSpendEvent.aggregate({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          createdAt: { gte: dayStart },
        },
        _sum: { amountUsd: true },
        _count: true,
      }),
      this.prisma.costSpendEvent.aggregate({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          createdAt: { gte: monthStart },
        },
        _sum: { amountUsd: true },
        _count: true,
      }),
      this.prisma.costSpendEvent.groupBy({
        by: ['category'],
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          createdAt: { gte: monthStart },
        },
        _sum: { amountUsd: true },
        _count: true,
      }),
    ]);

    const dailySpentUsd = dailyAgg._sum.amountUsd ?? 0;
    const monthlySpentUsd = monthlyAgg._sum.amountUsd ?? 0;

    return {
      budget,
      daily: {
        spentUsd: dailySpentUsd,
        capUsd: budget.dailyCapUsd,
        remainingUsd: Math.max(0, budget.dailyCapUsd - dailySpentUsd),
        events: dailyAgg._count,
        withinCap: dailySpentUsd <= budget.dailyCapUsd,
      },
      monthly: {
        spentUsd: monthlySpentUsd,
        capUsd: budget.monthlyCapUsd,
        remainingUsd: Math.max(0, budget.monthlyCapUsd - monthlySpentUsd),
        events: monthlyAgg._count,
        withinCap: monthlySpentUsd <= budget.monthlyCapUsd,
      },
      byCategory: byCategory.map((c) => ({
        category: c.category,
        spentUsd: c._sum.amountUsd ?? 0,
        events: c._count,
      })),
      honesty: costOptimizationCatalog().honesty,
    };
  }

  /**
   * Hard gate used by record/check and AI Router resolve.
   * Throws 402 when enforce=true and projected spend exceeds caps.
   */
  async assertWithinCaps(
    input: AuthCtx & { additionalUsd?: number; soft?: boolean },
  ) {
    this.assertEnabled();
    const additionalUsd = Math.max(0, Number(input.additionalUsd ?? 0) || 0);
    const summary = await this.spendSummary(input);
    const { budget, daily, monthly } = summary;
    const nextDaily = daily.spentUsd + additionalUsd;
    const nextMonthly = monthly.spentUsd + additionalUsd;
    const dailyOk = nextDaily <= budget.dailyCapUsd + 1e-9;
    const monthlyOk = nextMonthly <= budget.monthlyCapUsd + 1e-9;
    const allowed = dailyOk && monthlyOk;

    const gate = {
      allowed,
      enforce: budget.enforce,
      additionalUsd,
      daily: { ...daily, projectedUsd: nextDaily, withinCap: dailyOk },
      monthly: { ...monthly, projectedUsd: nextMonthly, withinCap: monthlyOk },
      honesty: {
        enforcesSpendCaps: true,
        reportOnly: false,
      },
      note: allowed
        ? 'Within hard spend caps.'
        : `Hard spend ceiling exceeded: daily $${nextDaily.toFixed(4)} / $${budget.dailyCapUsd} or monthly $${nextMonthly.toFixed(4)} / $${budget.monthlyCapUsd}`,
    };

    if (!allowed && budget.enforce && !input.soft) {
      throw new ApiException(
        'cost_spend_ceiling',
        gate.note,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    return gate;
  }

  async check(
    input: AuthCtx & { additionalUsd?: number; soft?: boolean },
  ) {
    return this.assertWithinCaps(input);
  }

  async record(
    input: AuthCtx & {
      category?: string;
      amountUsd?: number;
      feature?: string;
      providerId?: string;
      label?: string;
    },
  ) {
    this.assertEnabled();
    const category = this.normalizeCategory(input.category ?? 'other');
    const amountUsd = Number(input.amountUsd);
    if (!Number.isFinite(amountUsd) || amountUsd < 0) {
      throw new ApiException(
        'validation_error',
        'amountUsd must be a non-negative number',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (amountUsd > 100_000) {
      throw new ApiException(
        'validation_error',
        'amountUsd exceeds per-event sanity ceiling',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.assertWithinCaps({ ...input, additionalUsd: amountUsd });

    const row = await this.prisma.costSpendEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        category,
        amountUsd,
        feature: (input.feature ?? '').slice(0, 64),
        providerId: (input.providerId ?? '').slice(0, 64),
        label: (input.label ?? '').slice(0, 128),
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'cost_optimization.spend_recorded',
      route: 'POST /v1/cost-optimization/record',
      ip: input.ip,
      metadata: { id: row.id, category, amountUsd },
    });

    const summary = await this.spendSummary(input);
    return {
      event: {
        id: row.id,
        category: row.category,
        amountUsd: row.amountUsd,
        feature: row.feature,
        providerId: row.providerId,
        label: row.label,
        createdAt: row.createdAt.toISOString(),
      },
      summary,
      note: 'Spend recorded under hard caps.',
    };
  }

  async optimize(
    input: AuthCtx & { feature?: string; tokensPer1k?: number },
  ) {
    this.assertEnabled();
    const feature = (input.feature ?? 'chat').trim().toLowerCase() as RouterFeature;
    if (!ROUTER_FEATURES.includes(feature)) {
      throw new ApiException(
        'validation_error',
        `feature must be one of ${ROUTER_FEATURES.join('|')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const tokensPer1k = Math.max(0.001, Number(input.tokensPer1k ?? 1) || 1);
    const route = routerFeatureRoutes().find((r) => r.feature === feature)!;
    const candidates = hydrateCandidates(route.candidates, feature)
      .map((c) => ({
        providerId: c.providerId,
        modelSlug: c.modelSlug,
        estimatedCostPer1kUsd: c.estimatedCostPer1kUsd,
        estimatedLatencyMs: c.estimatedLatencyMs,
        estimatedCostUsd: Number((c.estimatedCostPer1kUsd * tokensPer1k).toFixed(6)),
        configured: c.configured,
        region: c.region,
        role: c.role,
      }))
      .sort((a, b) => a.estimatedCostUsd - b.estimatedCostUsd);

    const { budget } = await this.getBudget(input);
    const cheapest = candidates[0] ?? null;
    const gate = await this.assertWithinCaps({
      ...input,
      additionalUsd: cheapest?.estimatedCostUsd ?? 0,
      soft: true,
    });

    return {
      feature,
      gatewayApi: route.gatewayApi,
      optimize: 'cost',
      preferSpot: budget.preferSpot,
      reservedCapacityUnits: budget.reservedCapacityUnits,
      candidates,
      selected: cheapest,
      spendGate: gate,
      note:
        'Cost-preferring plan over Gateway candidates. Spot/reserved are sandbox planning hints. Call AI Router / Gateway to execute.',
      honesty: costOptimizationCatalog().honesty,
    };
  }

  async gpuView(input: AuthCtx) {
    const ceilings = gpuCeilings();
    const active = await this.prisma.gpuAllocation.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        status: 'active',
      },
      take: 50,
    });
    const hourlyUsd = active.reduce((s, a) => s + a.estimatedHourlyUsd, 0);
    const instances = active.reduce((s, a) => s + a.instances, 0);
    const summary = await this.spendSummary(input);
    const nearCap =
      summary.daily.spentUsd / Math.max(summary.budget.dailyCapUsd, 1e-9) >= 0.8 ||
      summary.monthly.spentUsd / Math.max(summary.budget.monthlyCapUsd, 1e-9) >= 0.8;

    return {
      gpuCeilings: ceilings,
      inventory: { instances, hourlyUsd, allocations: active.length },
      withinGpuSpendCeiling: hourlyUsd <= ceilings.maxSpendUsd,
      scaleAdvice: nearCap
        ? 'Near workspace spend caps — scale down or stop new GPU allocations (never open-ended autoscale).'
        : 'Within workspace spend caps; GPU allocate/scale still hard-clamped by VL-205 ceilings.',
      preferSpot: summary.budget.preferSpot,
      reservedCapacityUnits: summary.budget.reservedCapacityUnits,
      spend: summary,
      honesty: {
        ...costOptimizationCatalog().honesty,
        cloudSpotApis: false,
        openEndedAutoscale: false,
      },
    };
  }

  async predictions(input: AuthCtx) {
    const summary = await this.spendSummary(input);
    const now = new Date();
    const dayOfMonth = now.getUTCDate();
    const projectedMonthEnd =
      dayOfMonth <= 1
        ? summary.monthly.spentUsd
        : (summary.monthly.spentUsd / dayOfMonth) * 30;
    const { budget } = summary;

    return {
      dailyRunRateUsd: summary.daily.spentUsd,
      projectedMonthEndUsd: Number(projectedMonthEnd.toFixed(4)),
      willExceedMonthlyCap: projectedMonthEnd > budget.monthlyCapUsd,
      preferSpot: budget.preferSpot,
      reservedCapacityUnits: budget.reservedCapacityUnits,
      spotPlan: {
        enabled: budget.preferSpot,
        note: 'Sandbox planning hint — does not call AWS/GCP Spot APIs.',
        estimatedSavingsPct: budget.preferSpot ? 40 : 0,
      },
      reservedPlan: {
        units: budget.reservedCapacityUnits,
        note: 'Sandbox reservedCapacityUnits on budget — not a reserved-instance marketplace.',
      },
      recommendation: projectedMonthEnd > budget.monthlyCapUsd
        ? 'Projected to exceed monthly cap — reduce provider/GPU spend or raise caps deliberately.'
        : 'Projection within monthly cap under linear extrapolation.',
      honesty: costOptimizationCatalog().honesty,
      note: 'Linear extrapolation from ledger — not ML forecasting OS.',
    };
  }

  async reports(input: AuthCtx) {
    const summary = await this.spendSummary(input);
    const recent = await this.prisma.costSpendEvent.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      summary,
      recentEvents: recent.map((e) => ({
        id: e.id,
        category: e.category,
        amountUsd: e.amountUsd,
        feature: e.feature,
        providerId: e.providerId,
        label: e.label,
        createdAt: e.createdAt.toISOString(),
      })),
      note: 'Ledger-backed spend report — not a BI/FinOps OS.',
      honesty: costOptimizationCatalog().honesty,
    };
  }

  async analytics(input: AuthCtx) {
    const summary = await this.spendSummary(input);
    return {
      dailyUtilization:
        summary.daily.spentUsd / Math.max(summary.budget.dailyCapUsd, 1e-9),
      monthlyUtilization:
        summary.monthly.spentUsd / Math.max(summary.budget.monthlyCapUsd, 1e-9),
      categories: summary.byCategory.length,
      eventsMonth: summary.monthly.events,
      enforce: summary.budget.enforce,
      honesty: costOptimizationCatalog().honesty,
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, summary, predictions] = await Promise.all([
      Promise.resolve(this.engine()),
      this.spendSummary(input),
      this.predictions(input),
    ]);
    return {
      mode: engine.mode,
      ceilings: engine.ceilings,
      summary,
      predictions,
      spendSafety: engine.spendSafety,
      honesty: engine.honesty,
    };
  }

  private assertEnabled() {
    if (costOptimizationMode() === 'disabled') {
      throw new ApiException(
        'cost_optimization_disabled',
        'Cost Optimization mode is disabled (LUGEMI_COST_OPTIMIZATION_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private clampCap(value: number, max: number) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      throw new ApiException(
        'validation_error',
        'cap USD must be a positive number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return Math.min(max, n);
  }

  private normalizeCategory(raw: string): CostSpendCategory {
    const c = raw.trim().toLowerCase() as CostSpendCategory;
    if (!COST_SPEND_CATEGORIES.includes(c)) {
      throw new ApiException(
        'validation_error',
        `category must be one of ${COST_SPEND_CATEGORIES.join('|')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return c;
  }
}

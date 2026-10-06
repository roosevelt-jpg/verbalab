import { HttpStatus, Injectable } from '@nestjs/common';
import * as os from 'os';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { gpuCeilings } from '../gpu-platform/gpu-platform.catalog';
import {
  aiRuntimeAnalyticsCatalog,
  aiRuntimeAnalyticsMode,
} from './ai-runtime-analytics.catalog';

type PeriodInput = {
  organizationId: string;
  workspaceId: string;
  from?: string;
  to?: string;
};

@Injectable()
export class AiRuntimeAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  engine() {
    return {
      ...aiRuntimeAnalyticsCatalog(),
      mode: aiRuntimeAnalyticsMode(),
      spendSafety: {
        hardSpendCeilingsRequired: true,
        note:
          'Analytics is report-only. Spend enforcement remains Cost Optimization + GPU ceilings.',
      },
    };
  }

  async overview(input: PeriodInput) {
    this.assertEnabled();
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [latency, throughput, gpu, cache, requests, errors, cost, models, streaming] =
      await Promise.all([
        this.latency(input),
        this.throughput(input),
        this.gpu(input),
        this.cache(input),
        this.requests(input),
        this.errors(input),
        this.cost(input),
        this.models(input),
        this.streaming(input),
      ]);
    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      latency: { samples: latency.samples, p50Ms: latency.p50Ms, p95Ms: latency.p95Ms },
      throughput: {
        routerDecisions: throughput.routerDecisions,
        usageEvents: throughput.usageEvents,
        batchRuns: throughput.batchRuns,
        streamingSessions: throughput.streamingSessions,
      },
      gpu: { activeInstances: gpu.activeInstances, hourlyUsd: gpu.hourlyUsd },
      cache: { hits: cache.hits, misses: cache.misses, hitRate: cache.hitRate },
      requests: { total: requests.total },
      errors: { total: errors.total },
      cost: { ledgerUsd: cost.ledgerUsd, gpuHourlyUsd: cost.gpuHourlyUsd },
      models: { distinctSelected: models.distinctSelected, deployments: models.deployments },
      streaming: { sessions: streaming.sessions, chunks: streaming.chunks },
      honesty: aiRuntimeAnalyticsCatalog().honesty,
      note: 'AI Runtime Analytics overview — Inference Cloud aggregates only.',
    };
  }

  async latency(input: PeriodInput) {
    this.assertEnabled();
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const scope = this.scope(input, periodStart, periodEnd);

    const [audits, batches] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
          action: {
            in: [
              'ai_router.resolved',
              'streaming_runtime.streamed',
              'batch_runtime.completed',
              'chat.completed',
              'embeddings.created',
            ],
          },
        },
        select: { action: true, metadata: true },
        take: 5000,
      }),
      this.prisma.batchRun.findMany({
        where: {
          ...scope,
          status: 'completed',
          updatedAt: { gte: periodStart, lt: periodEnd },
        },
        select: { createdAt: true, updatedAt: true, kind: true },
        take: 2000,
      }),
    ]);

    const samples: number[] = [];
    const bySource: Record<string, number[]> = {};

    for (const e of audits) {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const ms =
        typeof meta.latencyMs === 'number'
          ? meta.latencyMs
          : typeof meta.durationMs === 'number'
            ? meta.durationMs
            : null;
      if (ms == null || ms < 0) continue;
      samples.push(ms);
      bySource[e.action] = bySource[e.action] ?? [];
      bySource[e.action]!.push(ms);
    }

    for (const b of batches) {
      const ms = Math.max(0, b.updatedAt.getTime() - b.createdAt.getTime());
      samples.push(ms);
      const key = `batch.${b.kind}`;
      bySource[key] = bySource[key] ?? [];
      bySource[key]!.push(ms);
    }

    const sorted = [...samples].sort((a, b) => a - b);
    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      samples: sorted.length,
      p50Ms: percentile(sorted, 0.5),
      p95Ms: percentile(sorted, 0.95),
      maxMs: sorted.length ? sorted[sorted.length - 1]! : null,
      bySource: Object.entries(bySource).map(([source, vals]) => {
        const s = [...vals].sort((a, b) => a - b);
        return {
          source,
          samples: s.length,
          p50Ms: percentile(s, 0.5),
          p95Ms: percentile(s, 0.95),
        };
      }),
      note: 'Latency proxies from audit metadata + batch duration — not APM/tracing OS.',
      honesty: { apmOs: false, aggregatesOnly: true },
    };
  }

  async throughput(input: PeriodInput) {
    this.assertEnabled();
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const scope = this.scope(input, periodStart, periodEnd);

    const [routerDecisions, usageEvents, batchRuns, streamingSessions] = await Promise.all([
      this.prisma.aiRouterDecision.count({
        where: { ...scope, createdAt: { gte: periodStart, lt: periodEnd } },
      }),
      this.prisma.usageEvent.count({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.batchRun.count({
        where: { ...scope, createdAt: { gte: periodStart, lt: periodEnd } },
      }),
      this.prisma.streamingSession.count({
        where: { ...scope, createdAt: { gte: periodStart, lt: periodEnd } },
      }),
    ]);

    const hours = Math.max(
      1 / 60,
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60),
    );
    const total = routerDecisions + usageEvents + batchRuns + streamingSessions;

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      routerDecisions,
      usageEvents,
      batchRuns,
      streamingSessions,
      total,
      perHour: Number((total / hours).toFixed(2)),
      note: 'Throughput from Inference Cloud ledgers + usage_events.',
    };
  }

  async gpu(input: PeriodInput) {
    this.assertEnabled();
    const ceilings = gpuCeilings();
    const allocations = await this.prisma.gpuAllocation.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      take: 200,
    });
    const active = allocations.filter((a) => a.status === 'active');
    const activeInstances = active.reduce((s, a) => s + a.instances, 0);
    const hourlyUsd = active.reduce((s, a) => s + a.estimatedHourlyUsd, 0);
    const byVendor: Record<string, number> = {};
    for (const a of active) {
      byVendor[a.vendor] = (byVendor[a.vendor] ?? 0) + a.instances;
    }
    return {
      ceilings,
      activeInstances,
      hourlyUsd,
      allocationCount: allocations.length,
      activeCount: active.length,
      byVendor,
      withinSpendCeiling: hourlyUsd <= ceilings.maxSpendUsd,
      note: 'Sandbox GpuAllocation aggregates — not cloud GPU telemetry OS.',
      honesty: { cloudGpuTelemetryOs: false },
    };
  }

  async cpu(_input: PeriodInput) {
    this.assertEnabled();
    const load = os.loadavg();
    const cpus = os.cpus().length;
    const usage = process.cpuUsage();
    const mem = process.memoryUsage();
    return {
      host: {
        cpuCount: cpus,
        load1: load[0] ?? 0,
        load5: load[1] ?? 0,
        load15: load[2] ?? 0,
        freememMb: Math.round(os.freemem() / (1024 * 1024)),
        totalmemMb: Math.round(os.totalmem() / (1024 * 1024)),
      },
      process: {
        userMicros: usage.user,
        systemMicros: usage.system,
        rssMb: Math.round(mem.rss / (1024 * 1024)),
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      },
      note: 'Nest host/process snapshot for CPU runtime path — not cluster APM OS.',
      honesty: { apmOs: false, aggregatesOnly: true },
    };
  }

  async cache(input: PeriodInput) {
    this.assertEnabled();
    const rows = await this.prisma.cacheEntry.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      select: { hits: true, misses: true, namespace: true },
      take: 5000,
    });
    let hits = 0;
    let misses = 0;
    const byNamespace: Record<string, { hits: number; misses: number; entries: number }> = {};
    for (const r of rows) {
      hits += r.hits;
      misses += r.misses;
      const cur = byNamespace[r.namespace] ?? { hits: 0, misses: 0, entries: 0 };
      cur.hits += r.hits;
      cur.misses += r.misses;
      cur.entries += 1;
      byNamespace[r.namespace] = cur;
    }
    const denom = hits + misses;
    return {
      entries: rows.length,
      hits,
      misses,
      hitRate: denom === 0 ? null : Number((hits / denom).toFixed(4)),
      byNamespace: Object.entries(byNamespace).map(([namespace, v]) => ({
        namespace,
        ...v,
      })),
      note: 'Intelligent Cache hit/miss aggregates.',
    };
  }

  async requests(input: PeriodInput) {
    this.assertEnabled();
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const scope = this.scope(input, periodStart, periodEnd);

    const [usage, router, streaming, batch, usageByFeature] = await Promise.all([
      this.prisma.usageEvent.count({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.aiRouterDecision.count({
        where: { ...scope, createdAt: { gte: periodStart, lt: periodEnd } },
      }),
      this.prisma.streamingSession.count({
        where: { ...scope, createdAt: { gte: periodStart, lt: periodEnd } },
      }),
      this.prisma.batchRun.count({
        where: { ...scope, createdAt: { gte: periodStart, lt: periodEnd } },
      }),
      this.prisma.usageEvent.groupBy({
        by: ['feature'],
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        _count: true,
      }),
    ]);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      usageEvents: usage,
      routerDecisions: router,
      streamingSessions: streaming,
      batchRuns: batch,
      total: usage + router + streaming + batch,
      byUsageFeature: usageByFeature.map((f) => ({
        feature: f.feature,
        count: f._count,
      })),
      note: 'Request counts across Inference Cloud surfaces + usage_events.',
    };
  }

  async errors(input: PeriodInput) {
    this.assertEnabled();
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const scope = this.scope(input, periodStart, periodEnd);

    const [failedBatch, failedStreaming, auditFails] = await Promise.all([
      this.prisma.batchRun.count({
        where: {
          ...scope,
          status: 'failed',
          updatedAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.streamingSession.count({
        where: {
          ...scope,
          status: 'failed',
          updatedAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
          OR: [
            { action: { contains: 'failed' } },
            { action: { contains: 'error' } },
            { action: { contains: 'rejected' } },
          ],
        },
      }),
    ]);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      failedBatchRuns: failedBatch,
      failedStreamingSessions: failedStreaming,
      auditFailureLike: auditFails,
      total: failedBatch + failedStreaming + auditFails,
      note: 'Error proxies from batch/streaming status + audit action names — not Sentry/APM OS.',
      honesty: { apmOs: false },
    };
  }

  async cost(input: PeriodInput) {
    this.assertEnabled();
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [ledger, byCategory, activeGpu] = await Promise.all([
      this.prisma.costSpendEvent.aggregate({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        _sum: { amountUsd: true },
        _count: true,
      }),
      this.prisma.costSpendEvent.groupBy({
        by: ['category'],
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        _sum: { amountUsd: true },
        _count: true,
      }),
      this.prisma.gpuAllocation.findMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'active',
        },
        select: { estimatedHourlyUsd: true },
      }),
    ]);

    const gpuHourlyUsd = activeGpu.reduce((s, a) => s + a.estimatedHourlyUsd, 0);
    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      ledgerUsd: ledger._sum.amountUsd ?? 0,
      events: ledger._count,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        amountUsd: c._sum.amountUsd ?? 0,
        events: c._count,
      })),
      gpuHourlyUsd,
      note: 'Cost ledger + GPU hourly estimates — report-only here; enforce on Cost Optimization.',
      honesty: { reportOnly: true, enforcesSpendCaps: false },
    };
  }

  async customers(input: PeriodInput) {
    this.assertEnabled();
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [workspaces, activeWorkspaces, decisions] = await Promise.all([
      this.prisma.workspace.count({
        where: { organizationId: input.organizationId },
      }),
      this.prisma.aiRouterDecision.findMany({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        select: { workspaceId: true },
        distinct: ['workspaceId'],
        take: 500,
      }),
      this.prisma.aiRouterDecision.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
    ]);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      organizationId: input.organizationId,
      workspaceCount: workspaces,
      activeWorkspacesInPeriod: activeWorkspaces.length,
      currentWorkspaceDecisions: decisions,
      note: 'Org/workspace activity counts — not a CRM or multi-tenant billing customer OS.',
      honesty: { crmOs: false, biDashboardOs: false },
    };
  }

  async models(input: PeriodInput) {
    this.assertEnabled();
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const scope = this.scope(input, periodStart, periodEnd);

    const [byModel, byProvider, deployments] = await Promise.all([
      this.prisma.aiRouterDecision.groupBy({
        by: ['selectedModel'],
        where: { ...scope, createdAt: { gte: periodStart, lt: periodEnd } },
        _count: true,
      }),
      this.prisma.aiRouterDecision.groupBy({
        by: ['selectedProvider'],
        where: { ...scope, createdAt: { gte: periodStart, lt: periodEnd } },
        _count: true,
      }),
      this.prisma.modelServingDeployment.findMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
        select: {
          modelSlug: true,
          kind: true,
          status: true,
          trafficPercent: true,
          version: true,
        },
        take: 100,
      }),
    ]);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      distinctSelected: byModel.filter((m) => m.selectedModel).length,
      bySelectedModel: byModel
        .map((m) => ({ model: m.selectedModel || '(none)', count: m._count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 40),
      bySelectedProvider: byProvider
        .map((p) => ({ provider: p.selectedProvider, count: p._count }))
        .sort((a, b) => b.count - a.count),
      deployments: deployments.length,
      deploymentRows: deployments,
      note: 'AI Router selections + Model Serving deployments — registry not regenerated.',
    };
  }

  async streaming(input: PeriodInput) {
    this.assertEnabled();
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const scope = this.scope(input, periodStart, periodEnd);

    const sessions = await this.prisma.streamingSession.findMany({
      where: { ...scope, createdAt: { gte: periodStart, lt: periodEnd } },
      select: { kind: true, status: true, chunkCount: true, transport: true },
      take: 5000,
    });

    const byKind: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let chunks = 0;
    for (const s of sessions) {
      byKind[s.kind] = (byKind[s.kind] ?? 0) + 1;
      byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
      chunks += s.chunkCount;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      sessions: sessions.length,
      chunks,
      byKind: Object.entries(byKind).map(([kind, count]) => ({ kind, count })),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      note: 'Streaming Runtime session aggregates — not WebSocket/video OS.',
    };
  }

  async report(input: PeriodInput) {
    this.assertEnabled();
    const [
      overview,
      latency,
      throughput,
      gpu,
      cpu,
      cache,
      requests,
      errors,
      cost,
      customers,
      models,
      streaming,
    ] = await Promise.all([
      this.overview(input),
      this.latency(input),
      this.throughput(input),
      this.gpu(input),
      this.cpu(input),
      this.cache(input),
      this.requests(input),
      this.errors(input),
      this.cost(input),
      this.customers(input),
      this.models(input),
      this.streaming(input),
    ]);
    return {
      product: 'Lugemi AI Runtime Analytics',
      overview,
      latency,
      throughput,
      gpu,
      cpu,
      cache,
      requests,
      errors,
      cost,
      customers,
      models,
      streaming,
      honesty: aiRuntimeAnalyticsCatalog().honesty,
      note: 'Bundled Inference Cloud runtime report — not enterprise BI/PDF suite.',
    };
  }

  async monitoring(input: PeriodInput) {
    this.assertEnabled();
    const [engine, overview, errors, cost] = await Promise.all([
      Promise.resolve(this.engine()),
      this.overview(input),
      this.errors(input),
      this.cost(input),
    ]);
    return {
      mode: engine.mode,
      overview,
      errors,
      cost,
      spendSafety: engine.spendSafety,
      honesty: engine.honesty,
    };
  }

  private assertEnabled() {
    if (aiRuntimeAnalyticsMode() === 'disabled') {
      throw new ApiException(
        'ai_runtime_analytics_disabled',
        'AI Runtime Analytics mode is disabled (LUGEMI_AI_RUNTIME_ANALYTICS_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private scope(input: PeriodInput, _from: Date, _to: Date) {
    return {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
    };
  }

  private parsePeriod(from?: string, to?: string) {
    const periodEnd = to ? new Date(to) : new Date();
    const periodStart = from
      ? new Date(from)
      : new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      throw new ApiException(
        'validation_error',
        'from/to must be valid ISO timestamps',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (periodStart >= periodEnd) {
      throw new ApiException(
        'validation_error',
        'from must be before to',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { periodStart, periodEnd };
  }
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx]!;
}

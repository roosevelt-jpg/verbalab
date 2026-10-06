import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import {
  analyticsCostRates,
  estimateFeatureCostUsd,
  roundUsd,
} from '../analytics/analytics-cost';
import {
  INTEL_AUDIT_PREFIXES,
  INTEL_SURFACE_ACTIONS,
  intelligenceAnalyticsCatalog,
} from './intelligence-analytics.catalog';

type PeriodInput = {
  organizationId: string;
  workspaceId?: string;
  from?: string;
  to?: string;
};

@Injectable
export class IntelligenceAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  engine {
    return intelligenceAnalyticsCatalog;
  }

  async overview(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [usage, surfaces, costs, quality] = await Promise.all([
      this.usage(input),
      this.surfaces(input),
      this.costs(input),
      this.quality(input),
    ]);
    return {
      periodStart: periodStart.toISOString,
      periodEnd: periodEnd.toISOString,
      usage: {
        chat: usage.chat,
        embeddings: usage.embeddings,
      },
      surfaces: surfaces.bySurface.slice(0, 12),
      estimatedCostUsd: costs.estimatedUsd,
      quality: {
        avgDecisionConfidence: quality.avgDecisionConfidence,
        avgPromptEvalScore: quality.avgPromptEvalScore,
        samples: quality.samples,
      },
      note: 'Intelligence Analytics overview — not Language/Speech/Voice analytics.',
    };
  }

  async usage(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.usageEvent.findMany({
      where: {
        organizationId: input.organizationId,
        feature: { in: ['chat', 'embeddings'] },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { feature: true, units: true, provider: true },
    });

    const chat = { requests: 0, tokens: 0, byProvider: {} as Record<string, number> };
    const embeddings = { requests: 0, tokens: 0, byProvider: {} as Record<string, number> };
    for (const e of events) {
      if (e.feature === 'chat') {
        chat.requests += 1;
        chat.tokens += e.units;
        chat.byProvider[e.provider] = (chat.byProvider[e.provider] ?? 0) + e.units;
      } else {
        embeddings.requests += 1;
        embeddings.tokens += e.units;
        embeddings.byProvider[e.provider] = (embeddings.byProvider[e.provider] ?? 0) + e.units;
      }
    }

    return {
      periodStart: periodStart.toISOString,
      periodEnd: periodEnd.toISOString,
      chat,
      embeddings,
      note: 'From usage_events feature=chat|embeddings.',
    };
  }

  async surfaces(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const allActions = Object.values(INTEL_SURFACE_ACTIONS).flat;
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: { in: allActions },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { action: true },
      take: 10_000,
    });

    const byAction: Record<string, number> = {};
    for (const e of events) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    }

    const bySurface = Object.entries(INTEL_SURFACE_ACTIONS).map(([surface, actions]) => {
      const count = actions.reduce((sum, a) => sum + (byAction[a] ?? 0), 0);
      return { surface, count };
    }).sort((a, b) => b.count - a.count);

    return {
      periodStart: periodStart.toISOString,
      periodEnd: periodEnd.toISOString,
      totalEvents: events.length,
      bySurface,
      byAction: Object.entries(byAction)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 40),
      note: 'Intelligence Cloud surface audit aggregates.',
    };
  }

  async latency(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: { in: ['chat.completed', 'reasoning_cloud.reasoned', 'embeddings.created'] },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { action: true, metadata: true },
      take: 5000,
    });

    const samples: number[] = [];
    const byAction: Record<string, number[]> = {};
    for (const e of events) {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const latency =
        typeof meta.latencyMs === 'number'
          ? meta.latencyMs
          : typeof meta.durationMs === 'number'
            ? meta.durationMs
            : null;
      if (latency == null || latency < 0) continue;
      samples.push(latency);
      byAction[e.action] = byAction[e.action] ?? [];
      byAction[e.action]!.push(latency);
    }
    samples.sort((a, b) => a - b);

    const percentile = (arr: number[], p: number) => {
      if (!arr.length) return null;
      const idx = Math.min(arr.length - 1, Math.floor((p / 100) * arr.length));
      return arr[idx] ?? null;
    };

    return {
      periodStart: periodStart.toISOString,
      periodEnd: periodEnd.toISOString,
      samples: samples.length,
      p50Ms: percentile(samples, 50),
      p95Ms: percentile(samples, 95),
      maxMs: samples.length ? samples[samples.length - 1]! : null,
      byAction: Object.fromEntries(
        Object.entries(byAction).map(([action, vals]) => {
          const sorted = [...vals].sort((a, b) => a - b);
          return [
            action,
            { samples: sorted.length, p50Ms: percentile(sorted, 50), p95Ms: percentile(sorted, 95) },
          ];
        }),
      ),
      note: 'Partial latency from audit metadata latencyMs — not full distributed tracing.',
    };
  }

  async quality(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: {
          in: [
            'prompt_intelligence.evaluated',
            'decision_engine.decided',
            'recommendation_engine.recommended',
          ],
        },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { action: true, metadata: true },
      take: 5000,
    });

    const promptScores: number[] = [];
    const decisionConfidence: number[] = [];
    const recommendCounts: number[] = [];
    for (const e of events) {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      if (e.action === 'prompt_intelligence.evaluated' && typeof meta.score === 'number') {
        promptScores.push(meta.score);
      }
      if (e.action === 'decision_engine.decided' && typeof meta.confidence === 'number') {
        decisionConfidence.push(meta.confidence);
      }
      if (e.action === 'recommendation_engine.recommended' && typeof meta.count === 'number') {
        recommendCounts.push(meta.count);
      }
    }

    const avg = (arr: number[]) =>
      arr.length ? Number((arr.reduce((s, n) => s + n, 0) / arr.length).toFixed(3)) : null;

    return {
      periodStart: periodStart.toISOString,
      periodEnd: periodEnd.toISOString,
      samples: events.length,
      avgPromptEvalScore: avg(promptScores),
      promptEvalSamples: promptScores.length,
      avgDecisionConfidence: avg(decisionConfidence),
      decisionSamples: decisionConfidence.length,
      avgRecommendItemCount: avg(recommendCounts),
      recommendSamples: recommendCounts.length,
      note: 'Heuristic quality/confidence proxies — not a human eval lab.',
    };
  }

  async routing(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: 'decision_engine.decided',
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { metadata: true },
      take: 5000,
    });

    const byKind: Record<string, number> = {};
    const byDecision: Record<string, number> = {};
    for (const e of events) {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const kind = typeof meta.kind === 'string' ? meta.kind : 'unknown';
      const decision = typeof meta.decision === 'string' ? meta.decision : 'unknown';
      byKind[kind] = (byKind[kind] ?? 0) + 1;
      byDecision[`${kind}:${decision}`] = (byDecision[`${kind}:${decision}`] ?? 0) + 1;
    }

    return {
      periodStart: periodStart.toISOString,
      periodEnd: periodEnd.toISOString,
      decisions: events.length,
      byKind: Object.entries(byKind)
        .map(([kind, count]) => ({ kind, count }))
        .sort((a, b) => b.count - a.count),
      topDecisions: Object.entries(byDecision)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      note: 'Model/routing decisions from Decision Engine audits.',
    };
  }

  async costs(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const rates = analyticsCostRates;
    const events = await this.prisma.usageEvent.findMany({
      where: {
        organizationId: input.organizationId,
        feature: { in: ['chat', 'embeddings'] },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { feature: true, units: true },
    });

    let chatUnits = 0;
    let embedUnits = 0;
    for (const e of events) {
      if (e.feature === 'chat') chatUnits += e.units;
      else embedUnits += e.units;
    }
    const chatUsd = estimateFeatureCostUsd('chat', chatUnits, rates);
    const embedUsd = estimateFeatureCostUsd('embeddings', embedUnits, rates);

    return {
      periodStart: periodStart.toISOString,
      periodEnd: periodEnd.toISOString,
      estimatedUsd: roundUsd(chatUsd + embedUsd),
      currency: 'USD' as const,
      breakdown: [
        { feature: 'chat', units: chatUnits, estimatedUsd: roundUsd(chatUsd) },
        { feature: 'embeddings', units: embedUnits, estimatedUsd: roundUsd(embedUsd) },
      ],
      rates: {
        chatPer1kTokens: rates.chatPer1kTokens,
        embeddingsPer1kTokens: rates.embeddingsPer1kTokens,
      },
      note: 'Estimated USD from usage_events — not Stripe invoices.',
    };
  }

  async report(input: PeriodInput) {
    const [overview, usage, surfaces, latency, quality, routing, costs] = await Promise.all([
      this.overview(input),
      this.usage(input),
      this.surfaces(input),
      this.latency(input),
      this.quality(input),
      this.routing(input),
      this.costs(input),
    ]);
    return {
      generatedAt: new Date.toISOString,
      overview,
      usage,
      surfaces,
      latency,
      quality,
      routing,
      costs,
      honesty: intelligenceAnalyticsCatalog.honesty,
      note: 'Bundled Intelligence Analytics report.',
    };
  }

  async monitoring(input: PeriodInput) {
    const [overview, engine] = await Promise.all([
      this.overview(input),
      Promise.resolve(this.engine),
    ]);
    const recent = await this.prisma.auditEvent.count({
      where: {
        organizationId: input.organizationId,
        createdAt: { gte: new Date(Date.now - 24 * 60 * 60 * 1000) },
        OR: INTEL_AUDIT_PREFIXES.map((p) => ({ action: { startsWith: p } })),
      },
    });
    return {
      generatedAt: new Date.toISOString,
      periodStart: overview.periodStart,
      periodEnd: overview.periodEnd,
      estimatedCostUsd: overview.estimatedCostUsd,
      eventsLast24h: recent,
      regeneratesSpeechAnalytics: engine.honesty.regeneratesSpeechAnalytics,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      note: 'Intelligence Analytics monitoring snapshot.',
    };
  }

  private parsePeriod(fromRaw?: string, toRaw?: string): {
    periodStart: Date;
    periodEnd: Date;
  } {
    const now = new Date;
    let periodStart: Date;
    let periodEnd: Date;

    if (fromRaw) {
      periodStart = new Date(fromRaw);
      if (Number.isNaN(periodStart.getTime)) {
        throw new ApiException('validation_error', 'from must be an ISO date', HttpStatus.BAD_REQUEST);
      }
    } else {
      periodStart = new Date(Date.UTC(now.getUTCFullYear, now.getUTCMonth, 1));
    }

    if (toRaw) {
      periodEnd = new Date(toRaw);
      if (Number.isNaN(periodEnd.getTime)) {
        throw new ApiException('validation_error', 'to must be an ISO date', HttpStatus.BAD_REQUEST);
      }
    } else {
      periodEnd = new Date(now.getTime + 1);
    }

    if (periodEnd <= periodStart) {
      throw new ApiException(
        'validation_error',
        'to must be after from',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { periodStart, periodEnd };
  }
}

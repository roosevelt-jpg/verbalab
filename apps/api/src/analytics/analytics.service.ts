import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import {
  analyticsCostRates,
  estimateFeatureCostUsd,
  roundUsd,
} from './analytics-cost';
import { languageAnalyticsCatalog } from './language-analytics.catalog';

export type AnalyticsOverview = {
  periodStart: string;
  periodEnd: string;
  byFeature: Array<{
    feature: string;
    requests: number;
    units: number;
    unitType: string;
    estimatedCostUsd: number;
  }>;
  byLanguagePair: Array<{
    source: string;
    target: string;
    requests: number;
    characters: number;
  }>;
  cost: {
    estimatedUsd: number;
    currency: 'USD';
    note: string;
    rates: ReturnType<typeof analyticsCostRates>;
  };
  errors: {
    jobSucceeded: number;
    jobFailed: number;
    jobTotal: number;
    errorRate: number;
  };
};

type PeriodInput = { organizationId: string; from?: string; to?: string };

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  catalog() {
    return languageAnalyticsCatalog();
  }

  async overview(input: PeriodInput): Promise<AnalyticsOverview> {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const rates = analyticsCostRates();

    const [featureRows, pairRows, jobSucceeded, jobFailed] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ feature: string; unit_type: string; requests: bigint; units: bigint }>
      >`
        SELECT feature, unit_type, COUNT(*)::bigint AS requests, COALESCE(SUM(units), 0)::bigint AS units
        FROM usage_events
        WHERE organization_id = ${input.organizationId}
          AND created_at >= ${periodStart}
          AND created_at < ${periodEnd}
        GROUP BY feature, unit_type
        ORDER BY units DESC
      `,
      this.prisma.$queryRaw<
        Array<{
          source_lang: string;
          target_lang: string;
          requests: bigint;
          characters: bigint;
        }>
      >`
        SELECT source_lang, target_lang,
               COUNT(*)::bigint AS requests,
               COALESCE(SUM(characters), 0)::bigint AS characters
        FROM translation_requests
        WHERE organization_id = ${input.organizationId}
          AND created_at >= ${periodStart}
          AND created_at < ${periodEnd}
        GROUP BY source_lang, target_lang
        ORDER BY characters DESC
        LIMIT 50
      `,
      this.prisma.job.count({
        where: {
          organizationId: input.organizationId,
          status: 'succeeded',
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.job.count({
        where: {
          organizationId: input.organizationId,
          status: 'failed',
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
    ]);

    const byFeature = featureRows.map((row) => {
      const units = Number(row.units);
      const feature = row.feature;
      return {
        feature,
        requests: Number(row.requests),
        units,
        unitType: row.unit_type,
        estimatedCostUsd: roundUsd(estimateFeatureCostUsd(feature, units, rates)),
      };
    });

    const byLanguagePair = pairRows.map((row) => ({
      source: row.source_lang,
      target: row.target_lang,
      requests: Number(row.requests),
      characters: Number(row.characters),
    }));

    const estimatedUsd = roundUsd(
      byFeature.reduce((sum, row) => sum + row.estimatedCostUsd, 0),
    );

    const jobTotal = jobSucceeded + jobFailed;
    const errorRate =
      jobTotal === 0 ? 0 : Math.round((jobFailed / jobTotal) * 10_000) / 10_000;

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      byFeature,
      byLanguagePair,
      cost: {
        estimatedUsd,
        currency: 'USD',
        note: 'Internal estimate from usage units × configured rates — not Stripe invoices.',
        rates,
      },
      errors: {
        jobSucceeded,
        jobFailed,
        jobTotal,
        errorRate,
      },
    };
  }

  async translationUsage(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [byProvider, totals, tmHits] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ provider: string; requests: bigint; characters: bigint; avg_latency: number | null }>
      >`
        SELECT provider,
               COUNT(*)::bigint AS requests,
               COALESCE(SUM(characters), 0)::bigint AS characters,
               AVG(latency_ms)::float8 AS avg_latency
        FROM translation_requests
        WHERE organization_id = ${input.organizationId}
          AND created_at >= ${periodStart}
          AND created_at < ${periodEnd}
        GROUP BY provider
        ORDER BY characters DESC
      `,
      this.prisma.$queryRaw<Array<{ requests: bigint; characters: bigint }>>`
        SELECT COUNT(*)::bigint AS requests, COALESCE(SUM(characters), 0)::bigint AS characters
        FROM translation_requests
        WHERE organization_id = ${input.organizationId}
          AND created_at >= ${periodStart}
          AND created_at < ${periodEnd}
      `,
      this.prisma.translationRequest.count({
        where: {
          organizationId: input.organizationId,
          provider: 'tm',
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
    ]);

    const total = totals[0];
    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      requests: Number(total?.requests ?? 0),
      characters: Number(total?.characters ?? 0),
      tmHits,
      byProvider: byProvider.map((r) => ({
        provider: r.provider,
        requests: Number(r.requests),
        characters: Number(r.characters),
        avgLatencyMs: r.avg_latency == null ? null : Math.round(r.avg_latency),
      })),
      note: 'Translation usage from translation_requests (VL-146).',
    };
  }

  async languageUsage(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [asSource, asTarget] = await Promise.all([
      this.prisma.$queryRaw<Array<{ lang: string; requests: bigint; characters: bigint }>>`
        SELECT source_lang AS lang, COUNT(*)::bigint AS requests, COALESCE(SUM(characters), 0)::bigint AS characters
        FROM translation_requests
        WHERE organization_id = ${input.organizationId}
          AND created_at >= ${periodStart}
          AND created_at < ${periodEnd}
        GROUP BY source_lang
        ORDER BY characters DESC
        LIMIT 40
      `,
      this.prisma.$queryRaw<Array<{ lang: string; requests: bigint; characters: bigint }>>`
        SELECT target_lang AS lang, COUNT(*)::bigint AS requests, COALESCE(SUM(characters), 0)::bigint AS characters
        FROM translation_requests
        WHERE organization_id = ${input.organizationId}
          AND created_at >= ${periodStart}
          AND created_at < ${periodEnd}
        GROUP BY target_lang
        ORDER BY characters DESC
        LIMIT 40
      `,
    ]);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      asSource: asSource.map((r) => ({
        language: r.lang,
        requests: Number(r.requests),
        characters: Number(r.characters),
      })),
      asTarget: asTarget.map((r) => ({
        language: r.lang,
        requests: Number(r.requests),
        characters: Number(r.characters),
      })),
      note: 'Language usage aggregates from translation_requests (VL-146).',
    };
  }

  async countryUsage(input: PeriodInput) {
    const languages = await this.languageUsage(input);
    const packs = await this.prisma.countryPack.findMany({
      select: { code: true, nameEn: true, region: true, primaryLanguages: true },
    });

    const langChars = new Map<string, number>();
    for (const row of [...languages.asSource, ...languages.asTarget]) {
      langChars.set(row.language, (langChars.get(row.language) ?? 0) + row.characters);
    }

    const byCountry = packs
      .map((pack) => {
        const langs = Array.isArray(pack.primaryLanguages)
          ? (pack.primaryLanguages as string[])
          : [];
        let score = 0;
        const matched: string[] = [];
        for (const lang of langs) {
          const chars = langChars.get(lang) ?? 0;
          if (chars > 0) {
            score += chars;
            matched.push(lang);
          }
        }
        return {
          code: pack.code,
          name: pack.nameEn,
          region: pack.region,
          matchedLanguages: matched,
          inferredCharacters: score,
        };
      })
      .filter((r) => r.inferredCharacters > 0)
      .sort((a, b) => b.inferredCharacters - a.inferredCharacters)
      .slice(0, 40);

    return {
      periodStart: languages.periodStart,
      periodEnd: languages.periodEnd,
      byCountry,
      note: 'Inferred country interest from language↔country-pack mapping (VL-146) — not geo-IP or visit analytics.',
    };
  }

  async dialectUsage(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: { in: ['dialect.detect', 'accent.detect'] },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { action: true, metadata: true },
      take: 5_000,
    });

    const dialectCounts = new Map<string, number>();
    const accentCounts = new Map<string, number>();
    let dialectDetects = 0;
    let accentDetects = 0;

    for (const ev of events) {
      const meta = (ev.metadata ?? {}) as Record<string, unknown>;
      if (ev.action === 'dialect.detect') {
        dialectDetects += 1;
        const code = typeof meta.dialect === 'string' && meta.dialect ? meta.dialect : 'unknown';
        dialectCounts.set(code, (dialectCounts.get(code) ?? 0) + 1);
      } else {
        accentDetects += 1;
        const code = typeof meta.accent === 'string' && meta.accent ? meta.accent : 'unknown';
        accentCounts.set(code, (accentCounts.get(code) ?? 0) + 1);
      }
    }

    const toRows = (map: Map<string, number>) =>
      [...map.entries()]
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 40);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      dialectDetects,
      accentDetects,
      byDialect: toRows(dialectCounts),
      byAccent: toRows(accentCounts),
      note: 'Dialect/accent usage from audit events (VL-131/132/146).',
    };
  }

  async quality(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const reviews = await this.prisma.translationReview.findMany({
      where: {
        organizationId: input.organizationId,
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { qualityScore: true, status: true, needsReview: true },
      take: 10_000,
    });

    const total = reviews.length;
    const accepted = reviews.filter((r) => r.status === 'accepted').length;
    const rejected = reviews.filter((r) => r.status === 'rejected').length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const needsReview = reviews.filter((r) => r.needsReview).length;
    const avgScore =
      total === 0
        ? null
        : Math.round(
            (reviews.reduce((s, r) => s + r.qualityScore, 0) / total) * 100,
          ) / 100;
    const accuracyProxy =
      accepted + rejected === 0
        ? null
        : Math.round((accepted / (accepted + rejected)) * 10_000) / 10_000;

    const buckets = { '0-49': 0, '50-69': 0, '70-84': 0, '85-100': 0 };
    for (const r of reviews) {
      if (r.qualityScore < 50) buckets['0-49'] += 1;
      else if (r.qualityScore < 70) buckets['50-69'] += 1;
      else if (r.qualityScore < 85) buckets['70-84'] += 1;
      else buckets['85-100'] += 1;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      reviews: total,
      accepted,
      rejected,
      pending,
      needsReview,
      averageQualityScore: avgScore,
      scoreBuckets: buckets,
      translationAccuracyProxy: accuracyProxy,
      note: 'Heuristic quality scores + review outcomes (VL-146). Accuracy proxy is accept/(accept+reject) — not BLEU or human evaluation.',
    };
  }

  async latency(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const rows = await this.prisma.$queryRaw<
      Array<{
        samples: bigint;
        p50: number | null;
        p95: number | null;
        p99: number | null;
        max_ms: number | null;
        avg_ms: number | null;
      }>
    >`
      SELECT
        COUNT(*)::bigint AS samples,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms)::float8 AS p50,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)::float8 AS p95,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms)::float8 AS p99,
        MAX(latency_ms)::float8 AS max_ms,
        AVG(latency_ms)::float8 AS avg_ms
      FROM translation_requests
      WHERE organization_id = ${input.organizationId}
        AND created_at >= ${periodStart}
        AND created_at < ${periodEnd}
        AND latency_ms IS NOT NULL
    `;

    const row = rows[0];
    const round = (v: number | null | undefined) =>
      v == null || !Number.isFinite(v) ? null : Math.round(v);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      samples: Number(row?.samples ?? 0),
      avgMs: round(row?.avg_ms),
      p50Ms: round(row?.p50),
      p95Ms: round(row?.p95),
      p99Ms: round(row?.p99),
      maxMs: round(row?.max_ms),
      monitoring: {
        inProcess: 'GET /v1/metrics/translate',
        note: 'In-process percentiles are single-instance only.',
      },
      note: 'Org translation latency from persisted translation_requests (VL-146).',
    };
  }

  async costs(input: PeriodInput) {
    const overview = await this.overview(input);
    return {
      periodStart: overview.periodStart,
      periodEnd: overview.periodEnd,
      estimatedUsd: overview.cost.estimatedUsd,
      currency: overview.cost.currency,
      byFeature: overview.byFeature.map((f) => ({
        feature: f.feature,
        estimatedCostUsd: f.estimatedCostUsd,
        units: f.units,
        unitType: f.unitType,
        requests: f.requests,
      })),
      rates: overview.cost.rates,
      note: overview.cost.note,
    };
  }

  async monitoring(input: PeriodInput) {
    const [latency, overview, quality] = await Promise.all([
      this.latency(input),
      this.overview(input),
      this.quality(input),
    ]);
    return {
      periodStart: latency.periodStart,
      periodEnd: latency.periodEnd,
      latency,
      jobErrors: overview.errors,
      qualitySummary: {
        reviews: quality.reviews,
        averageQualityScore: quality.averageQualityScore,
        translationAccuracyProxy: quality.translationAccuracyProxy,
      },
      links: {
        metricsTranslate: '/v1/metrics/translate',
        overview: '/v1/analytics/overview',
      },
      note: 'Language Analytics monitoring snapshot (VL-146) — not a metrics SaaS.',
    };
  }

  async enterpriseReport(input: PeriodInput) {
    const [
      overview,
      translation,
      languages,
      countries,
      dialects,
      quality,
      latency,
      costs,
    ] = await Promise.all([
      this.overview(input),
      this.translationUsage(input),
      this.languageUsage(input),
      this.countryUsage(input),
      this.dialectUsage(input),
      this.quality(input),
      this.latency(input),
      this.costs(input),
    ]);

    return {
      product: 'Language Analytics Enterprise Report',
      generatedAt: new Date().toISOString(),
      periodStart: overview.periodStart,
      periodEnd: overview.periodEnd,
      overview,
      translation,
      languages,
      countries,
      dialects,
      quality,
      latency,
      costs,
      note: 'Bundled enterprise report JSON (VL-146). Not a scheduled BI export product.',
    };
  }

  private parsePeriod(fromRaw?: string, toRaw?: string): {
    periodStart: Date;
    periodEnd: Date;
  } {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (fromRaw) {
      periodStart = new Date(fromRaw);
      if (Number.isNaN(periodStart.getTime())) {
        throw new ApiException('validation_error', 'from must be an ISO date', HttpStatus.BAD_REQUEST);
      }
    } else {
      periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    }

    if (toRaw) {
      periodEnd = new Date(toRaw);
      if (Number.isNaN(periodEnd.getTime())) {
        throw new ApiException('validation_error', 'to must be an ISO date', HttpStatus.BAD_REQUEST);
      }
    } else {
      periodEnd = new Date(now.getTime() + 1);
    }

    if (periodEnd <= periodStart) {
      throw new ApiException(
        'validation_error',
        'to must be after from',
        HttpStatus.BAD_REQUEST,
      );
    }

    const maxDays = 366;
    const spanMs = periodEnd.getTime() - periodStart.getTime();
    if (spanMs > maxDays * 24 * 60 * 60 * 1000) {
      throw new ApiException(
        'validation_error',
        `Analytics window cannot exceed ${maxDays} days`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return { periodStart, periodEnd };
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import {
  analyticsCostRates,
  estimateFeatureCostUsd,
  roundUsd,
} from '../analytics/analytics-cost';
import {
  SPEECH_AUDIT_PREFIXES,
  speechAnalyticsCatalog,
} from './speech-analytics.catalog';

type PeriodInput = {
  organizationId: string;
  workspaceId?: string;
  from?: string;
  to?: string;
};

@Injectable()
export class SpeechAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  engine() {
    return speechAnalyticsCatalog();
  }

  async overview(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [usage, productActivity, costs] = await Promise.all([
      this.usage(input),
      this.productActivity(input),
      this.costs(input),
    ]);
    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      usage: {
        stt: usage.stt,
        tts: usage.tts,
      },
      productActivity: productActivity.byAction.slice(0, 12),
      estimatedCostUsd: costs.estimatedUsd,
      note: 'Speech Analytics overview (VL-159) — not a BI dashboard product.',
    };
  }

  async usage(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.usageEvent.findMany({
      where: {
        organizationId: input.organizationId,
        feature: { in: ['stt', 'tts'] },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { feature: true, units: true, provider: true, unitType: true },
    });

    const stt = { requests: 0, seconds: 0, byProvider: {} as Record<string, number> };
    const tts = { requests: 0, characters: 0, byProvider: {} as Record<string, number> };
    for (const e of events) {
      if (e.feature === 'stt') {
        stt.requests += 1;
        stt.seconds += e.units;
        stt.byProvider[e.provider] = (stt.byProvider[e.provider] ?? 0) + e.units;
      } else {
        tts.requests += 1;
        tts.characters += e.units;
        tts.byProvider[e.provider] = (tts.byProvider[e.provider] ?? 0) + e.units;
      }
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      stt: {
        ...stt,
        minutes: Math.round((stt.seconds / 60) * 1000) / 1000,
      },
      tts,
      note: 'From usage_events feature=stt|tts (VL-159).',
    };
  }

  async languages(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [audits, calls] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where: {
          organizationId: input.organizationId,
          action: 'speech.recognized',
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        select: { metadata: true },
        take: 5000,
      }),
      this.prisma.callRecord.findMany({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
          language: { not: null },
        },
        select: { language: true },
        take: 5000,
      }),
    ]);

    const byLanguage: Record<string, number> = {};
    for (const a of audits) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      const lang = typeof meta.language === 'string' && meta.language ? meta.language : 'unknown';
      byLanguage[lang] = (byLanguage[lang] ?? 0) + 1;
    }
    for (const c of calls) {
      const lang = c.language || 'unknown';
      byLanguage[lang] = (byLanguage[lang] ?? 0) + 1;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      byLanguage: Object.entries(byLanguage)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count),
      note: 'Speech language tags from STT audits + call records (VL-159).',
    };
  }

  async dialects(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: { in: ['dialect.detect', 'accent.detect', 'accent.classify'] },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { action: true, metadata: true },
      take: 5000,
    });

    const byAction: Record<string, number> = {};
    const byLabel: Record<string, number> = {};
    for (const e of events) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const label =
        (typeof meta.dialect === 'string' && meta.dialect) ||
        (typeof meta.accent === 'string' && meta.accent) ||
        (typeof meta.code === 'string' && meta.code) ||
        (typeof meta.label === 'string' && meta.label) ||
        'unknown';
      byLabel[label] = (byLabel[label] ?? 0) + 1;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      total: events.length,
      byAction,
      byLabel: Object.entries(byLabel)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 40),
      note: 'Dialect/accent detect audits — Speech Analytics view (VL-159).',
    };
  }

  async accuracy(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [sttAudits, pronunciation, calls] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where: {
          organizationId: input.organizationId,
          action: 'speech.recognized',
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        select: { metadata: true },
        take: 5000,
      }),
      this.prisma.auditEvent.findMany({
        where: {
          organizationId: input.organizationId,
          action: { in: ['pronunciation.assess', 'pronunciation.score'] },
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        select: { metadata: true },
        take: 2000,
      }),
      this.prisma.callRecord.findMany({
        where: {
          organizationId: input.organizationId,
          status: 'analyzed',
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        select: { analysisJson: true },
        take: 2000,
      }),
    ]);

    const confidences: number[] = [];
    for (const a of sttAudits) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      if (typeof meta.confidence === 'number' && Number.isFinite(meta.confidence)) {
        confidences.push(meta.confidence);
      }
    }

    const pronScores: number[] = [];
    for (const a of pronunciation) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      if (typeof meta.overall === 'number') pronScores.push(meta.overall);
    }

    const qaScores: number[] = [];
    for (const c of calls) {
      const analysis = c.analysisJson as { qa?: { score?: number } } | null;
      if (typeof analysis?.qa?.score === 'number') qaScores.push(analysis.qa.score);
    }

    const avg = (xs: number[]) =>
      xs.length ? Number((xs.reduce((s, v) => s + v, 0) / xs.length).toFixed(3)) : null;

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      sttConfidence: {
        samples: confidences.length,
        average: avg(confidences),
        note: 'Provider confidence when present on speech.recognized audits.',
      },
      pronunciationOverall: {
        samples: pronScores.length,
        average: avg(pronScores),
      },
      callQa: {
        samples: qaScores.length,
        average: avg(qaScores),
      },
      note: 'Accuracy proxies only — not golden-set WER / NIST eval (VL-159).',
    };
  }

  async latency(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const audits = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: 'speech.recognized',
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { metadata: true },
      take: 5000,
    });

    const durations: number[] = [];
    for (const a of audits) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      if (typeof meta.durationSeconds === 'number' && meta.durationSeconds > 0) {
        durations.push(meta.durationSeconds);
      }
    }
    durations.sort((a, b) => a - b);

    const percentile = (p: number) => {
      if (!durations.length) return null;
      const idx = Math.min(durations.length - 1, Math.floor((p / 100) * durations.length));
      return durations[idx] ?? null;
    };

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      samples: durations.length,
      audioDurationSeconds: {
        p50: percentile(50),
        p95: percentile(95),
        max: durations.length ? durations[durations.length - 1]! : null,
        average: durations.length
          ? Number((durations.reduce((s, v) => s + v, 0) / durations.length).toFixed(3))
          : null,
      },
      note: 'Audio duration from STT audits — not HTTP request latency p95 (VL-159).',
    };
  }

  async errors(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [failedJobs, speechAudits] = await Promise.all([
      this.prisma.job.count({
        where: {
          organizationId: input.organizationId,
          status: 'failed',
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.auditEvent.findMany({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
          OR: SPEECH_AUDIT_PREFIXES.map((p) => ({ action: { startsWith: p } })),
        },
        select: { action: true },
        take: 5000,
      }),
    ]);

    const errorAudits = speechAudits.filter(
      (e) => /error|fail/i.test(e.action),
    );
    const byAction: Record<string, number> = {};
    for (const e of errorAudits) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      failedJobsInPeriod: failedJobs,
      errorAuditEvents: errorAudits.length,
      byAction,
      note: 'Partial speech error surface — STT HTTP failures often lack audit rows; job failures are org-wide (VL-159).',
    };
  }

  async costs(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const rates = analyticsCostRates();
    const events = await this.prisma.usageEvent.findMany({
      where: {
        organizationId: input.organizationId,
        feature: { in: ['stt', 'tts'] },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { feature: true, units: true },
    });

    let sttUnits = 0;
    let ttsUnits = 0;
    for (const e of events) {
      if (e.feature === 'stt') sttUnits += e.units;
      else ttsUnits += e.units;
    }
    const sttUsd = estimateFeatureCostUsd('stt', sttUnits, rates);
    const ttsUsd = estimateFeatureCostUsd('tts', ttsUnits, rates);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      estimatedUsd: roundUsd(sttUsd + ttsUsd),
      currency: 'USD' as const,
      breakdown: [
        { feature: 'stt', units: sttUnits, unitType: 'seconds', estimatedUsd: roundUsd(sttUsd) },
        { feature: 'tts', units: ttsUnits, unitType: 'characters', estimatedUsd: roundUsd(ttsUsd) },
      ],
      rates: {
        sttPerMinute: rates.sttPerMinute,
        ttsPer1kChars: rates.ttsPer1kChars,
      },
      note: 'Estimated STT/TTS cost — not Stripe invoices (VL-159).',
    };
  }

  async customers(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        createdAt: { gte: periodStart, lt: periodEnd },
        OR: SPEECH_AUDIT_PREFIXES.map((p) => ({ action: { startsWith: p } })),
        apiKeyPrefix: { not: null },
      },
      select: { apiKeyPrefix: true, action: true },
      take: 5000,
    });

    const byKey: Record<string, number> = {};
    for (const e of events) {
      const prefix = e.apiKeyPrefix ?? 'unknown';
      byKey[prefix] = (byKey[prefix] ?? 0) + 1;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      activeKeyPrefixes: Object.keys(byKey).length,
      byKeyPrefix: Object.entries(byKey)
        .map(([apiKeyPrefix, events]) => ({ apiKeyPrefix, events }))
        .sort((a, b) => b.events - a.events)
        .slice(0, 50),
      note: 'API key prefixes with speech product audits — not CRM customers (VL-159).',
    };
  }

  async industries(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const audits = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: 'speech.recognized',
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { metadata: true },
      take: 5000,
    });

    const byPack: Record<string, number> = {};
    for (const a of audits) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      const packs = meta.industryPacks;
      if (Array.isArray(packs)) {
        for (const p of packs) {
          if (typeof p === 'string' && p) {
            byPack[p] = (byPack[p] ?? 0) + 1;
          }
        }
      }
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      byIndustryPack: Object.entries(byPack)
        .map(([pack, count]) => ({ pack, count }))
        .sort((a, b) => b.count - a.count),
      note: 'Industry vocabulary packs applied on STT — not firmographic industry taxonomy (VL-159).',
    };
  }

  async monitoring(input: PeriodInput) {
    const [overview, errors, latency, accuracy] = await Promise.all([
      this.overview(input),
      this.errors(input),
      this.latency(input),
      this.accuracy(input),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      periodStart: overview.periodStart,
      periodEnd: overview.periodEnd,
      estimatedCostUsd: overview.estimatedCostUsd,
      failedJobsInPeriod: errors.failedJobsInPeriod,
      sttAudioDurationP95: latency.audioDurationSeconds.p95,
      averageSttConfidence: accuracy.sttConfidence.average,
      note: 'Speech Analytics monitoring snapshot + shared request IDs (VL-159).',
    };
  }

  async report(input: PeriodInput) {
    const [overview, usage, languages, dialects, accuracy, latency, errors, costs, customers, industries] =
      await Promise.all([
        this.overview(input),
        this.usage(input),
        this.languages(input),
        this.dialects(input),
        this.accuracy(input),
        this.latency(input),
        this.errors(input),
        this.costs(input),
        this.customers(input),
        this.industries(input),
      ]);

    return {
      product: 'Speech Analytics Enterprise Report',
      generatedAt: new Date().toISOString(),
      periodStart: overview.periodStart,
      periodEnd: overview.periodEnd,
      overview,
      usage,
      languages,
      dialects,
      accuracy,
      latency,
      errors,
      costs,
      customers,
      industries,
      note: 'Bundled Speech Analytics report (VL-159). Not a scheduled BI export product.',
    };
  }

  private async productActivity(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        createdAt: { gte: periodStart, lt: periodEnd },
        OR: SPEECH_AUDIT_PREFIXES.map((p) => ({ action: { startsWith: p } })),
      },
      select: { action: true },
      take: 8000,
    });
    const byActionMap: Record<string, number> = {};
    for (const e of events) {
      byActionMap[e.action] = (byActionMap[e.action] ?? 0) + 1;
    }
    return {
      total: events.length,
      byAction: Object.entries(byActionMap)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count),
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
      throw new ApiException('validation_error', 'to must be after from', HttpStatus.BAD_REQUEST);
    }

    const maxDays = 366;
    const spanMs = periodEnd.getTime() - periodStart.getTime();
    if (spanMs > maxDays * 24 * 60 * 60 * 1000) {
      throw new ApiException(
        'validation_error',
        `Speech analytics window cannot exceed ${maxDays} days`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return { periodStart, periodEnd };
  }
}

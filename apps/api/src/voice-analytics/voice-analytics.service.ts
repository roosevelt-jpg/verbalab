import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import {
  analyticsCostRates,
  estimateFeatureCostUsd,
  roundUsd,
} from '../analytics/analytics-cost';
import {
  VOICE_AUDIT_PREFIXES,
  voiceAnalyticsCatalog,
} from './voice-analytics.catalog';

type PeriodInput = {
  organizationId: string;
  workspaceId?: string;
  from?: string;
  to?: string;
};

@Injectable()
export class VoiceAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  engine() {
    return voiceAnalyticsCatalog();
  }

  async overview(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [usage, voices, revenue, marketplace, costs] = await Promise.all([
      this.usage(input),
      this.voices(input),
      this.revenue(input),
      this.marketplace(input),
      this.costs(input),
    ]);
    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      usage: {
        tts: usage.tts,
        voiceAudits: usage.voiceAudits,
      },
      topVoices: voices.byVoice.slice(0, 8),
      revenueCents: revenue.totalAmountCents,
      marketplace: {
        publishedListings: marketplace.publishedListings,
        installs: marketplace.installs,
        sales: marketplace.sales,
      },
      estimatedCostUsd: costs.estimatedUsd,
      note: 'Voice Analytics overview — not a BI dashboard product. Distinct from Speech Analytics.',
    };
  }

  async usage(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [events, audits] = await Promise.all([
      this.prisma.usageEvent.findMany({
        where: {
          organizationId: input.organizationId,
          feature: 'tts',
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        select: { units: true, provider: true },
      }),
      this.voiceAudits(input.organizationId, periodStart, periodEnd),
    ]);

    const tts = {
      requests: events.length,
      characters: 0,
      byProvider: {} as Record<string, number>,
    };
    for (const e of events) {
      tts.characters += e.units;
      tts.byProvider[e.provider] = (tts.byProvider[e.provider] ?? 0) + e.units;
    }

    const byAction: Record<string, number> = {};
    for (const a of audits) {
      byAction[a.action] = (byAction[a.action] ?? 0) + 1;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      tts,
      voiceAudits: {
        total: audits.length,
        byAction: Object.entries(byAction)
          .map(([action, count]) => ({ action, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 40),
      },
      note: 'From usage_events feature=tts + Voice Cloud audits. STT stays in Speech Analytics.',
    };
  }

  async languages(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const audits = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        createdAt: { gte: periodStart, lt: periodEnd },
        action: {
          in: [
            'tts.synthesized',
            'tts.streamed',
            'emotion_voice.synthesized',
            'emotion_voice.streamed',
            'voice_studio.generate',
            'voice_studio.preview',
          ],
        },
      },
      select: { metadata: true },
      take: 5000,
    });

    const byLanguage: Record<string, number> = {};
    for (const a of audits) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      let lang =
        typeof meta.language === 'string' && meta.language ? meta.language : null;
      if (!lang && typeof meta.voice === 'string') {
        lang = languageFromVoiceId(meta.voice);
      }
      const key = lang || 'unknown';
      byLanguage[key] = (byLanguage[key] ?? 0) + 1;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      byLanguage: Object.entries(byLanguage)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count),
      note: 'Voice synthesis language tags / voice id prefixes.',
    };
  }

  async voices(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [audits, clones] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
          action: {
            in: [
              'tts.synthesized',
              'tts.streamed',
              'emotion_voice.synthesized',
              'emotion_voice.streamed',
              'voice_studio.generate',
              'voice_studio.preview',
              'voice_studio.test',
            ],
          },
        },
        select: { metadata: true },
        take: 5000,
      }),
      this.prisma.voiceClone.groupBy({
        by: ['status'],
        where: { organizationId: input.organizationId },
        _count: { _all: true },
      }),
    ]);

    const byVoice: Record<string, number> = {};
    for (const a of audits) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      const voice =
        (typeof meta.voice === 'string' && meta.voice) ||
        (typeof meta.sourceVoiceId === 'string' && meta.sourceVoiceId) ||
        'unknown';
      byVoice[voice] = (byVoice[voice] ?? 0) + 1;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      byVoice: Object.entries(byVoice)
        .map(([voice, count]) => ({ voice, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50),
      clonesByStatus: clones.map((c) => ({
        status: c.status,
        count: c._count._all,
      })),
      note: 'Voice id frequency from synthesis audits + clone inventory.',
    };
  }

  async customers(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.voiceAudits(input.organizationId, periodStart, periodEnd);
    const withKeys = events.filter((e) => e.apiKeyPrefix);

    const byKey: Record<string, number> = {};
    for (const e of withKeys) {
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
      note: 'API key prefixes with Voice Cloud audits — not CRM customers.',
    };
  }

  async revenue(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const sales = await this.prisma.voiceListingSale.findMany({
      where: {
        publisherOrgId: input.organizationId,
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { amountCents: true, currency: true },
      take: 5000,
    });

    let totalAmountCents = 0;
    const byCurrency: Record<string, number> = {};
    for (const s of sales) {
      totalAmountCents += s.amountCents;
      byCurrency[s.currency] = (byCurrency[s.currency] ?? 0) + s.amountCents;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      saleCount: sales.length,
      totalAmountCents,
      byCurrency: Object.entries(byCurrency).map(([currency, amountCents]) => ({
        currency,
        amountCents,
      })),
      note: 'Publisher-side Voice Marketplace sales — not Stripe invoices.',
    };
  }

  async latency(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const audits = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        createdAt: { gte: periodStart, lt: periodEnd },
        action: {
          in: [
            'tts.synthesized',
            'tts.streamed',
            'emotion_voice.synthesized',
            'voice_studio.generate',
            'voice_enhancement.enhance',
          ],
        },
      },
      select: { metadata: true },
      take: 5000,
    });

    const samples: number[] = [];
    for (const a of audits) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      const ms =
        (typeof meta.latencyMs === 'number' && meta.latencyMs) ||
        (typeof meta.durationMs === 'number' && meta.durationMs) ||
        null;
      if (ms != null && ms > 0) samples.push(ms);
    }
    samples.sort((a, b) => a - b);

    const percentile = (p: number) => {
      if (!samples.length) return null;
      const idx = Math.min(samples.length - 1, Math.floor((p / 100) * samples.length));
      return samples[idx] ?? null;
    };

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      samples: samples.length,
      latencyMs: {
        p50: percentile(50),
        p95: percentile(95),
        max: samples.length ? samples[samples.length - 1]! : null,
        average: samples.length
          ? Number((samples.reduce((s, v) => s + v, 0) / samples.length).toFixed(1))
          : null,
      },
      note: 'Partial — only when audits carry latencyMs/durationMs. Not full HTTP request p95.',
    };
  }

  async quality(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [ttsAudits, bioAudits, listings] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
          action: { in: ['tts.synthesized', 'tts.streamed'] },
        },
        select: { metadata: true },
        take: 5000,
      }),
      this.prisma.auditEvent.findMany({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lt: periodEnd },
          action: {
            in: [
              'voice_biometrics.verified',
              'voice_biometrics.authenticated',
              'voice_biometrics.liveness',
            ],
          },
        },
        select: { metadata: true },
        take: 2000,
      }),
      this.prisma.voiceListing.findMany({
        where: {
          OR: [
            { publisherOrgId: input.organizationId },
            {
              installs: {
                some: { installerOrgId: input.organizationId },
              },
            },
          ],
        },
        select: { ratingSum: true, ratingCount: true },
        take: 500,
      }),
    ]);

    let watermarked = 0;
    let watermarkSamples = 0;
    for (const a of ttsAudits) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      if (typeof meta.watermarkApplied === 'boolean') {
        watermarkSamples += 1;
        if (meta.watermarkApplied) watermarked += 1;
      }
    }

    const confidences: number[] = [];
    for (const a of bioAudits) {
      const meta = (a.metadata ?? {}) as Record<string, unknown>;
      const c =
        (typeof meta.confidence === 'number' && meta.confidence) ||
        (typeof meta.score === 'number' && meta.score) ||
        null;
      if (c != null) confidences.push(c);
    }

    let ratingSum = 0;
    let ratingWeight = 0;
    for (const l of listings) {
      if (l.ratingCount > 0) {
        ratingSum += l.ratingSum;
        ratingWeight += l.ratingCount;
      }
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      watermark: {
        samples: watermarkSamples,
        applied: watermarked,
        rate: watermarkSamples
          ? Number((watermarked / watermarkSamples).toFixed(3))
          : null,
      },
      biometricConfidence: {
        samples: confidences.length,
        average: confidences.length
          ? Number(
              (confidences.reduce((s, v) => s + v, 0) / confidences.length).toFixed(3),
            )
          : null,
      },
      marketplaceRatingAverage: ratingWeight
        ? Number((ratingSum / ratingWeight).toFixed(2))
        : null,
      marketplaceRatingCount: ratingWeight,
      note: 'Quality proxies only — not MOS lab or golden-set voice eval.',
    };
  }

  async streaming(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        createdAt: { gte: periodStart, lt: periodEnd },
        action: { in: ['tts.streamed', 'emotion_voice.streamed'] },
      },
      select: { action: true, metadata: true },
      take: 5000,
    });

    const byAction: Record<string, number> = {};
    let totalChunks = 0;
    let totalBytes = 0;
    for (const e of events) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      if (typeof meta.chunks === 'number') totalChunks += meta.chunks;
      if (typeof meta.bytes === 'number') totalBytes += meta.bytes;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      streamEvents: events.length,
      byAction,
      totalChunks,
      totalBytes,
      note: 'Chunk SSE after full synthesis — not vendor token streaming.',
    };
  }

  async downloads(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        createdAt: { gte: periodStart, lt: periodEnd },
        action: {
          in: [
            'tts.synthesized',
            'tts.streamed',
            'emotion_voice.synthesized',
            'voice_studio.generate',
            'voice_enhancement.enhance',
            'voice_enhancement.upscale',
          ],
        },
      },
      select: { action: true, metadata: true },
      take: 5000,
    });

    let deliveries = 0;
    let totalBytes = 0;
    const byAction: Record<string, number> = {};
    for (const e of events) {
      deliveries += 1;
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      if (typeof meta.bytes === 'number') totalBytes += meta.bytes;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      deliveries,
      totalBytes,
      byAction,
      note: 'Audio delivery proxy from synthesis/enhancement audits — not a CDN download product.',
    };
  }

  async marketplace(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const orgId = input.organizationId;
    const [
      publishedListings,
      installs,
      reviews,
      salesAgg,
      listingAudits,
    ] = await Promise.all([
      this.prisma.voiceListing.count({
        where: {
          publisherOrgId: orgId,
          status: 'published',
        },
      }),
      this.prisma.voiceListingInstall.count({
        where: {
          OR: [
            { installerOrgId: orgId },
            { listing: { publisherOrgId: orgId } },
          ],
          installedAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.voiceListingReview.count({
        where: {
          OR: [
            { organizationId: orgId },
            { listing: { publisherOrgId: orgId } },
          ],
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.voiceListingSale.aggregate({
        where: {
          OR: [{ publisherOrgId: orgId }, { buyerOrgId: orgId }],
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        _count: { _all: true },
        _sum: { amountCents: true },
      }),
      this.prisma.auditEvent.findMany({
        where: {
          organizationId: orgId,
          createdAt: { gte: periodStart, lt: periodEnd },
          action: { startsWith: 'voice_marketplace.' },
        },
        select: { action: true },
        take: 2000,
      }),
    ]);

    const byAction: Record<string, number> = {};
    for (const a of listingAudits) {
      byAction[a.action] = (byAction[a.action] ?? 0) + 1;
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      publishedListings,
      installs,
      reviews,
      sales: salesAgg._count._all,
      salesAmountCents: salesAgg._sum.amountCents ?? 0,
      byAction,
      note: 'Voice Marketplace aggregates via Voice Analytics. ≠ localization marketplace.',
    };
  }

  async costs(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const rates = analyticsCostRates();
    const events = await this.prisma.usageEvent.findMany({
      where: {
        organizationId: input.organizationId,
        feature: 'tts',
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { units: true },
    });
    const ttsUnits = events.reduce((s, e) => s + e.units, 0);
    const ttsUsd = estimateFeatureCostUsd('tts', ttsUnits, rates);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      estimatedUsd: roundUsd(ttsUsd),
      currency: 'USD' as const,
      breakdown: [
        {
          feature: 'tts',
          units: ttsUnits,
          unitType: 'characters',
          estimatedUsd: roundUsd(ttsUsd),
        },
      ],
      rates: { ttsPer1kChars: rates.ttsPer1kChars },
      note: 'Estimated TTS cost only — not Stripe invoices; STT cost stays in Speech Analytics.',
    };
  }

  async monitoring(input: PeriodInput) {
    const [overview, latency, quality, streaming] = await Promise.all([
      this.overview(input),
      this.latency(input),
      this.quality(input),
      this.streaming(input),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      periodStart: overview.periodStart,
      periodEnd: overview.periodEnd,
      ttsRequests: overview.usage.tts.requests,
      estimatedCostUsd: overview.estimatedCostUsd,
      revenueCents: overview.revenueCents,
      latencyMsP95: latency.latencyMs.p95,
      watermarkRate: quality.watermark.rate,
      streamEvents: streaming.streamEvents,
      note: 'Voice Analytics monitoring snapshot + shared request IDs.',
    };
  }

  async report(input: PeriodInput) {
    const [
      overview,
      usage,
      languages,
      voices,
      customers,
      revenue,
      latency,
      quality,
      streaming,
      downloads,
      marketplace,
      costs,
    ] = await Promise.all([
      this.overview(input),
      this.usage(input),
      this.languages(input),
      this.voices(input),
      this.customers(input),
      this.revenue(input),
      this.latency(input),
      this.quality(input),
      this.streaming(input),
      this.downloads(input),
      this.marketplace(input),
      this.costs(input),
    ]);

    return {
      product: 'Voice Analytics Enterprise Report',
      generatedAt: new Date().toISOString(),
      periodStart: overview.periodStart,
      periodEnd: overview.periodEnd,
      overview,
      usage,
      languages,
      voices,
      customers,
      revenue,
      latency,
      quality,
      streaming,
      downloads,
      marketplace,
      costs,
      note: 'Bundled Voice Analytics report. Not a scheduled BI export. Distinct from Speech Analytics.',
    };
  }

  private async voiceAudits(organizationId: string, periodStart: Date, periodEnd: Date) {
    return this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: periodStart, lt: periodEnd },
        OR: VOICE_AUDIT_PREFIXES.map((p) => ({ action: { startsWith: p } })),
      },
      select: { action: true, apiKeyPrefix: true },
      take: 8000,
    });
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
        `Voice analytics window cannot exceed ${maxDays} days`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return { periodStart, periodEnd };
  }
}

function languageFromVoiceId(voice: string): string | null {
  const own = /^own:([a-z]{2,3})-/i.exec(voice);
  if (own?.[1]) return own[1].toLowerCase();
  const pack = /^language_pack:([a-z]{2,3})$/i.exec(voice);
  if (pack?.[1]) return pack[1].toLowerCase();
  return null;
}

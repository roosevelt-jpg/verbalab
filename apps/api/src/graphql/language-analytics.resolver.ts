import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  GqlAnalyticsOverviewSummary,
  GqlEnterpriseAnalyticsReport,
  GqlLanguageAnalytics,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
};

@Resolver
export class LanguageAnalyticsGraphqlResolver {
  constructor(private readonly analytics: AnalyticsService) {}

  @Query( => GqlLanguageAnalytics, { name: 'languageAnalytics' })
  languageAnalytics: GqlLanguageAnalytics {
    const c = this.analytics.catalog;
    return {
      product: c.product,
      note: c.note,
      capabilityCount: c.capabilities.length,
      shippedCount: c.capabilities.filter((x) => x.status === 'shipped').length,
    };
  }

  @Query( => GqlAnalyticsOverviewSummary, { name: 'analyticsOverview' })
  @UseGuards(TranslateAuthGuard)
  async analyticsOverview(
    @Context('req') req: GqlReq,
    @Args('from', { type:  => String, nullable: true }) from?: string,
    @Args('to', { type:  => String, nullable: true }) to?: string,
  ): Promise<GqlAnalyticsOverviewSummary> {
    const auth = req.translateAuth!;
    const overview = await this.analytics.overview({
      organizationId: auth.organizationId,
      from,
      to,
    });
    return {
      periodStart: overview.periodStart,
      periodEnd: overview.periodEnd,
      estimatedCostUsd: overview.cost.estimatedUsd,
      jobErrorRate: overview.errors.errorRate,
      languagePairCount: overview.byLanguagePair.length,
      featureCount: overview.byFeature.length,
    };
  }

  @Query( => GqlEnterpriseAnalyticsReport, { name: 'enterpriseAnalyticsReport' })
  @UseGuards(TranslateAuthGuard)
  async enterpriseAnalyticsReport(
    @Context('req') req: GqlReq,
    @Args('from', { type:  => String, nullable: true }) from?: string,
    @Args('to', { type:  => String, nullable: true }) to?: string,
  ): Promise<GqlEnterpriseAnalyticsReport> {
    const auth = req.translateAuth!;
    const report = await this.analytics.enterpriseReport({
      organizationId: auth.organizationId,
      from,
      to,
    });
    return {
      product: report.product,
      generatedAt: report.generatedAt,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      estimatedCostUsd: report.costs.estimatedUsd,
      translationRequests: report.translation.requests,
      averageQualityScore: report.quality.averageQualityScore,
      p95LatencyMs: report.latency.p95Ms,
      note: report.note,
    };
  }
}

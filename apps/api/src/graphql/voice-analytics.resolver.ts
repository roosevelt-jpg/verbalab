import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { VoiceAnalyticsService } from '../voice-analytics/voice-analytics.service';
import { GqlVoiceAnalyticsEngine, GqlVoiceAnalyticsOverview } from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
};

@Resolver()
export class VoiceAnalyticsGraphqlResolver {
  constructor(private readonly analytics: VoiceAnalyticsService) {}

  @Query(() => GqlVoiceAnalyticsEngine, { name: 'voiceAnalyticsEngine' })
  voiceAnalyticsEngine(): GqlVoiceAnalyticsEngine {
    const c = this.analytics.engine();
    return {
      product: c.product,
      note: c.note,
      capabilityCount: c.capabilities.length,
      shippedCount: c.capabilities.filter((x) => x.status === 'shipped').length,
      regeneratesSpeechAnalytics: c.honesty.regeneratesSpeechAnalytics,
      biDashboardProduct: c.honesty.biDashboardProduct,
    };
  }

  @Query(() => GqlVoiceAnalyticsOverview, { name: 'voiceAnalyticsOverview' })
  @UseGuards(TranslateAuthGuard)
  async voiceAnalyticsOverview(
    @Context('req') req: GqlReq,
    @Args('from', { type: () => String, nullable: true }) from?: string,
    @Args('to', { type: () => String, nullable: true }) to?: string,
  ): Promise<GqlVoiceAnalyticsOverview> {
    const auth = req.translateAuth!;
    const overview = await this.analytics.overview({
      organizationId: auth.organizationId,
      from,
      to,
    });
    return {
      periodStart: overview.periodStart,
      periodEnd: overview.periodEnd,
      estimatedCostUsd: overview.estimatedCostUsd,
      ttsRequests: overview.usage.tts.requests,
      revenueCents: overview.revenueCents,
    };
  }
}

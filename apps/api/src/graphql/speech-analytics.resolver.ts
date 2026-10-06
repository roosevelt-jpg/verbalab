import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SpeechAnalyticsService } from '../speech-analytics/speech-analytics.service';
import { GqlSpeechAnalyticsEngine, GqlSpeechAnalyticsOverview } from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
};

@Resolver()
export class SpeechAnalyticsGraphqlResolver {
  constructor(private readonly analytics: SpeechAnalyticsService) {}

  @Query(() => GqlSpeechAnalyticsEngine, { name: 'speechAnalyticsEngine' })
  speechAnalyticsEngine(): GqlSpeechAnalyticsEngine {
    const c = this.analytics.engine();
    return {
      product: c.product,
      note: c.note,
      capabilityCount: c.capabilities.length,
      shippedCount: c.capabilities.filter((x) => x.status === 'shipped').length,
    };
  }

  @Query(() => GqlSpeechAnalyticsOverview, { name: 'speechAnalyticsOverview' })
  @UseGuards(TranslateAuthGuard)
  async speechAnalyticsOverview(
    @Context('req') req: GqlReq,
    @Args('from', { type: () => String, nullable: true }) from?: string,
    @Args('to', { type: () => String, nullable: true }) to?: string,
  ): Promise<GqlSpeechAnalyticsOverview> {
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
      sttRequests: overview.usage.stt.requests,
      ttsRequests: overview.usage.tts.requests,
    };
  }
}

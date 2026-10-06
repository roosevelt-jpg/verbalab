import { Query, Resolver } from '@nestjs/graphql';
import { IntelligenceAnalyticsService } from '../intelligence-analytics/intelligence-analytics.service';
import { GqlIntelligenceAnalytics } from './gql.types';

@Resolver
export class IntelligenceAnalyticsGraphqlResolver {
  constructor(private readonly analytics: IntelligenceAnalyticsService) {}

  @Query( => GqlIntelligenceAnalytics, { name: 'intelligenceAnalytics' })
  intelligenceAnalytics: GqlIntelligenceAnalytics {
    const c = this.analytics.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      regeneratesSpeechAnalytics: c.honesty.regeneratesSpeechAnalytics,
      regeneratesVoiceAnalytics: c.honesty.regeneratesVoiceAnalytics,
      biDashboardOs: c.honesty.biDashboardOs,
      aggregatesOnly: c.honesty.aggregatesOnly,
    };
  }
}

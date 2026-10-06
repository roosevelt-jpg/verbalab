import { Query, Resolver } from '@nestjs/graphql';
import { KnowledgeAnalyticsService } from '../knowledge-analytics/knowledge-analytics.service';
import { GqlKnowledgeAnalytics } from './gql.types';

@Resolver
export class KnowledgeAnalyticsGraphqlResolver {
  constructor(private readonly analytics: KnowledgeAnalyticsService) {}

  @Query( => GqlKnowledgeAnalytics, { name: 'knowledgeAnalytics' })
  knowledgeAnalytics: GqlKnowledgeAnalytics {
    const c = this.analytics.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      regeneratesLanguageAnalytics: c.honesty.regeneratesLanguageAnalytics,
      regeneratesSpeechAnalytics: c.honesty.regeneratesSpeechAnalytics,
      regeneratesVoiceAnalytics: c.honesty.regeneratesVoiceAnalytics,
      regeneratesIntelligenceAnalytics: c.honesty.regeneratesIntelligenceAnalytics,
      biDashboardOs: c.honesty.biDashboardOs,
      aggregatesOnly: c.honesty.aggregatesOnly,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
    };
  }
}

import { Query, Resolver } from '@nestjs/graphql';
import { AiRuntimeAnalyticsService } from '../ai-runtime-analytics/ai-runtime-analytics.service';
import { GqlAiRuntimeAnalyticsEngine } from './gql.types';

@Resolver()
export class AiRuntimeAnalyticsGraphqlResolver {
  constructor(private readonly analytics: AiRuntimeAnalyticsService) {}

  @Query(() => GqlAiRuntimeAnalyticsEngine, { name: 'aiRuntimeAnalyticsEngine' })
  aiRuntimeAnalyticsEngine(): GqlAiRuntimeAnalyticsEngine {
    const c = this.analytics.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      biDashboardOs: c.honesty.biDashboardOs,
      apmOs: c.honesty.apmOs,
      cloudGpuTelemetryOs: c.honesty.cloudGpuTelemetryOs,
      regeneratesIntelligenceAnalytics: c.honesty.regeneratesIntelligenceAnalytics,
      regeneratesKnowledgeAnalytics: c.honesty.regeneratesKnowledgeAnalytics,
      enterpriseReportingSuite: c.honesty.enterpriseReportingSuite,
      aggregatesOnly: c.honesty.aggregatesOnly,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      extendsInferenceCloud: c.honesty.extendsInferenceCloud,
      mode: c.mode,
    };
  }
}

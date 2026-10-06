import { Query, Resolver } from '@nestjs/graphql';
import { KnowledgeIntelligenceService } from '../knowledge-intelligence/knowledge-intelligence.service';
import { GqlKnowledgeIntelligenceEngine } from './gql.types';

@Resolver
export class KnowledgeIntelligenceGraphqlResolver {
  constructor(private readonly knowledgeIntel: KnowledgeIntelligenceService) {}

  @Query( => GqlKnowledgeIntelligenceEngine, { name: 'knowledgeIntelligenceEngine' })
  knowledgeIntelligenceEngine: GqlKnowledgeIntelligenceEngine {
    const c = this.knowledgeIntel.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      biOs: c.honesty.biOs,
      regeneratesIntelligenceAnalytics: c.honesty.regeneratesIntelligenceAnalytics,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      extendsKnowledgeCloud: c.honesty.extendsKnowledgeCloud,
    };
  }
}

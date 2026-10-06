import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetCulturalIntelligenceEngineQuery } from '../cultural-intelligence/application/messages';
import { GqlCulturalIntelligenceEngine } from './gql.types';

@Resolver
export class CulturalIntelligenceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlCulturalIntelligenceEngine, { name: 'culturalIntelligenceEngine' })
  async culturalIntelligenceEngine: Promise<GqlCulturalIntelligenceEngine> {
    const catalog = await this.queries.execute(new GetCulturalIntelligenceEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      traditionalKnowledgeConsentRequired: catalog.honesty.traditionalKnowledgeConsentRequired,
    };
  }
}

import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetTourismHeritageIntelligenceEngineQuery } from '../tourism-heritage-intelligence/application/messages';
import { GqlTourismHeritageIntelligenceEngine } from './gql.types';

@Resolver
export class TourismHeritageIntelligenceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlTourismHeritageIntelligenceEngine, { name: 'tourismHeritageIntelligenceEngine' })
  async tourismHeritageIntelligenceEngine: Promise<GqlTourismHeritageIntelligenceEngine> {
    const catalog = await this.queries.execute(new GetTourismHeritageIntelligenceEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      traditionalKnowledgeConsentRequired: catalog.honesty.traditionalKnowledgeConsentRequired,
    };
  }
}

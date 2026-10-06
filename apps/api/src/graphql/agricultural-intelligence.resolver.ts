import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAgriculturalIntelligenceEngineQuery } from '../agricultural-intelligence/application/messages';
import { GqlAgriculturalIntelligenceEngine } from './gql.types';

@Resolver
export class AgriculturalIntelligenceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlAgriculturalIntelligenceEngine, { name: 'agriculturalIntelligenceEngine' })
  async agriculturalIntelligenceEngine: Promise<GqlAgriculturalIntelligenceEngine> {
    const catalog = await this.queries.execute(new GetAgriculturalIntelligenceEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      verticalOperationsOs: catalog.honesty.verticalOperationsOs,
    };
  }
}

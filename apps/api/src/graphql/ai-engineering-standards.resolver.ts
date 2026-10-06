import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiEngineeringStandardsEngineQuery } from '../ai-engineering-standards/application/messages';
import { GqlAiEngineeringStandardsEngine } from './gql.types';

@Resolver
export class AiEngineeringStandardsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlAiEngineeringStandardsEngine, { name: 'aiEngineeringStandardsEngine' })
  async aiEngineeringStandardsEngine: Promise<GqlAiEngineeringStandardsEngine> {
    const catalog = await this.queries.execute(new GetAiEngineeringStandardsEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      engineeringOsForHumansAndCursor: catalog.honesty.engineeringOsForHumansAndCursor,
      customerFacingProductCloud: catalog.honesty.customerFacingProductCloud,
      architectureKnowledgeBaseOs: catalog.honesty.architectureKnowledgeBaseOs,
      adrFactoryOs: catalog.honesty.adrFactoryOs,
    };
  }
}

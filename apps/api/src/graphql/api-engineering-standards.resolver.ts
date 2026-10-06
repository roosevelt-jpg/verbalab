import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetApiEngineeringStandardsEngineQuery } from '../api-engineering-standards/application/messages';
import { GqlApiEngineeringStandardsEngine } from './gql.types';

@Resolver()
export class ApiEngineeringStandardsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlApiEngineeringStandardsEngine, { name: 'apiEngineeringStandardsEngine' })
  async apiEngineeringStandardsEngine(): Promise<GqlApiEngineeringStandardsEngine> {
    const catalog = await this.queries.execute(new GetApiEngineeringStandardsEngineQuery());
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

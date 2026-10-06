import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetInfrastructureEngineeringStandardsEngineQuery } from '../infrastructure-engineering-standards/application/messages';
import { GqlInfrastructureEngineeringStandardsEngine } from './gql.types';

@Resolver
export class InfrastructureEngineeringStandardsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlInfrastructureEngineeringStandardsEngine, { name: 'infrastructureEngineeringStandardsEngine' })
  async infrastructureEngineeringStandardsEngine: Promise<GqlInfrastructureEngineeringStandardsEngine> {
    const catalog = await this.queries.execute(new GetInfrastructureEngineeringStandardsEngineQuery);
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

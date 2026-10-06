import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetEngineeringGovernanceEngineQuery } from '../engineering-governance/application/messages';
import { GqlEngineeringGovernanceEngine } from './gql.types';

@Resolver
export class EngineeringGovernanceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlEngineeringGovernanceEngine, { name: 'engineeringGovernanceEngine' })
  async engineeringGovernanceEngine: Promise<GqlEngineeringGovernanceEngine> {
    const catalog = await this.queries.execute(new GetEngineeringGovernanceEngineQuery);
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

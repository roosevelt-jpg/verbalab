import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetArchitectureGovernanceEngineQuery } from '../architecture-governance/application/messages';
import { GqlArchitectureGovernanceEngine } from './gql.types';

@Resolver()
export class ArchitectureGovernanceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlArchitectureGovernanceEngine, { name: 'architectureGovernanceEngine' })
  async architectureGovernanceEngine(): Promise<GqlArchitectureGovernanceEngine> {
    const catalog = await this.queries.execute(new GetArchitectureGovernanceEngineQuery());
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

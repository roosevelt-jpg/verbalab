import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetRepositoryStandardsEngineQuery } from '../repository-standards/application/messages';
import { GqlRepositoryStandardsEngine } from './gql.types';

@Resolver()
export class RepositoryStandardsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlRepositoryStandardsEngine, { name: 'repositoryStandardsEngine' })
  async repositoryStandardsEngine(): Promise<GqlRepositoryStandardsEngine> {
    const catalog = await this.queries.execute(new GetRepositoryStandardsEngineQuery());
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

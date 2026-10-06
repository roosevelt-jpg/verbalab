import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetDatabaseEngineeringStandardsEngineQuery } from '../database-engineering-standards/application/messages';
import { GqlDatabaseEngineeringStandardsEngine } from './gql.types';

@Resolver()
export class DatabaseEngineeringStandardsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlDatabaseEngineeringStandardsEngine, { name: 'databaseEngineeringStandardsEngine' })
  async databaseEngineeringStandardsEngine(): Promise<GqlDatabaseEngineeringStandardsEngine> {
    const catalog = await this.queries.execute(new GetDatabaseEngineeringStandardsEngineQuery());
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

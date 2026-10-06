import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiOperationsDashboardEngineQuery } from '../ai-operations-dashboard/application/messages';
import { GqlAiOperationsDashboardEngine } from './gql.types';

@Resolver
export class AiOperationsDashboardGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlAiOperationsDashboardEngine, { name: 'aiOperationsDashboardEngine' })
  async aiOperationsDashboardEngine: Promise<GqlAiOperationsDashboardEngine> {
    const catalog = await this.queries.execute(new GetAiOperationsDashboardEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      trustCloudOs: catalog.honesty.trustCloudOs,
    };
  }
}

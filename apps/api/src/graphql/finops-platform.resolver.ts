import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetFinopsPlatformEngineQuery } from '../finops-platform/application/messages';
import { GqlFinopsPlatformEngine } from './gql.types';

@Resolver
export class FinopsPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlFinopsPlatformEngine, { name: 'finopsPlatformEngine' })
  async finopsPlatformEngine: Promise<GqlFinopsPlatformEngine> {
    const catalog = await this.queries.execute(new GetFinopsPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      finopsOs: catalog.honesty.finopsOs,
      gpuBudgetAlertsEnabled: catalog.gpuBudgetAlertsEnabled === true,
    };
  }
}

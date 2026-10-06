import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalSchedulerEngineQuery } from '../global-scheduler/application/messages';
import { GqlGlobalSchedulerEngine } from './gql.types';

@Resolver
export class GlobalSchedulerGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlGlobalSchedulerEngine, { name: 'globalSchedulerEngine' })
  async globalSchedulerEngine: Promise<GqlGlobalSchedulerEngine> {
    const catalog = await this.queries.execute(new GetGlobalSchedulerEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      executesInference: catalog.honesty.executesInference,
    };
  }
}

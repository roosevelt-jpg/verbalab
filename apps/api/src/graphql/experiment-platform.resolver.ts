import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetExperimentPlatformEngineQuery } from '../experiment-platform/application/messages';
import { GqlExperimentPlatformEngine } from './gql.types';

@Resolver()
export class ExperimentPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlExperimentPlatformEngine, { name: 'experimentPlatformEngine' })
  async experimentPlatformEngine(): Promise<GqlExperimentPlatformEngine> {
    const catalog = await this.queries.execute(new GetExperimentPlatformEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      weightsAndBiasesOs: catalog.honesty.weightsAndBiasesOs,
    };
  }
}

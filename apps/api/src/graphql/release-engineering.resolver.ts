import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetReleaseEngineeringEngineQuery } from '../release-engineering/application/messages';
import { GqlReleaseEngineeringEngine } from './gql.types';

@Resolver()
export class ReleaseEngineeringGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlReleaseEngineeringEngine, { name: 'releaseEngineeringEngine' })
  async releaseEngineeringEngine(): Promise<GqlReleaseEngineeringEngine> {
    const catalog = await this.queries.execute(new GetReleaseEngineeringEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      spinnakerOs: catalog.honesty.spinnakerOs,
    };
  }
}

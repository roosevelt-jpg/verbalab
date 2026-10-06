import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetReliabilityEngineeringEngineQuery } from '../reliability-engineering/application/messages';
import { GqlReliabilityEngineeringEngine } from './gql.types';

@Resolver()
export class ReliabilityEngineeringGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlReliabilityEngineeringEngine, { name: 'reliabilityEngineeringEngine' })
  async reliabilityEngineeringEngine(): Promise<GqlReliabilityEngineeringEngine> {
    const catalog = await this.queries.execute(new GetReliabilityEngineeringEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      datadogOs: catalog.honesty.datadogOs,
    };
  }
}

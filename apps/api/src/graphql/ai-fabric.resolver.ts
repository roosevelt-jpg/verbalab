import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListAiFabricBusesQuery } from '../ai-fabric/application/messages';
import { GqlAiFabricBus } from './gql.types';

@Resolver
export class AiFabricGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlAiFabricBus], { name: 'aiFabricBuses' })
  aiFabricBuses: Promise<GqlAiFabricBus[]> {
    return this.queries.execute(new ListAiFabricBusesQuery);
  }
}

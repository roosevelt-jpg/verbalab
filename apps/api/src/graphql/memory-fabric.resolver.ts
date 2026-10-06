import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import {
  ListMemoryFabricCapabilitiesQuery,
  ListMemoryFabricRoutesQuery,
} from '../memory-fabric/application/messages';
import { GqlMemoryFabricCapability, GqlMemoryFabricRoute } from './gql.types';

@Resolver
export class MemoryFabricGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlMemoryFabricCapability], { name: 'memoryFabricCapabilities' })
  memoryFabricCapabilities: Promise<GqlMemoryFabricCapability[]> {
    return this.queries.execute(new ListMemoryFabricCapabilitiesQuery);
  }

  @Query( => [GqlMemoryFabricRoute], { name: 'memoryFabricRoutes' })
  memoryFabricRoutes: Promise<GqlMemoryFabricRoute[]> {
    return this.queries.execute(new ListMemoryFabricRoutesQuery);
  }
}

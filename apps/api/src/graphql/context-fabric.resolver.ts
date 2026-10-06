import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import {
  ListContextFabricCapabilitiesQuery,
  ListContextFabricRoutesQuery,
} from '../context-fabric/application/messages';
import { GqlContextFabricCapability, GqlContextFabricRoute } from './gql.types';

@Resolver()
export class ContextFabricGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlContextFabricCapability], { name: 'contextFabricCapabilities' })
  contextFabricCapabilities(): Promise<GqlContextFabricCapability[]> {
    return this.queries.execute(new ListContextFabricCapabilitiesQuery());
  }

  @Query(() => [GqlContextFabricRoute], { name: 'contextFabricRoutes' })
  contextFabricRoutes(): Promise<GqlContextFabricRoute[]> {
    return this.queries.execute(new ListContextFabricRoutesQuery());
  }
}

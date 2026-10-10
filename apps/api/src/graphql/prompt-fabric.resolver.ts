import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import {
  ListPromptFabricCapabilitiesQuery,
  ListPromptFabricRoutesQuery,
} from '../prompt-fabric/application/messages';
import { GqlPromptFabricCapability, GqlPromptFabricRoute } from './gql.types';

@Resolver()
export class PromptFabricGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlPromptFabricCapability], { name: 'promptFabricCapabilities' })
  promptFabricCapabilities(): Promise<GqlPromptFabricCapability[]> {
    return this.queries.execute(new ListPromptFabricCapabilitiesQuery());
  }

  @Query(() => [GqlPromptFabricRoute], { name: 'promptFabricRoutes' })
  promptFabricRoutes(): Promise<GqlPromptFabricRoute[]> {
    return this.queries.execute(new ListPromptFabricRoutesQuery());
  }
}

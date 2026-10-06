import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import {
  ListReasoningFabricCapabilitiesQuery,
  ListReasoningFabricRoutesQuery,
} from '../reasoning-fabric/application/messages';
import { GqlReasoningFabricCapability, GqlReasoningFabricRoute } from './gql.types';

@Resolver
export class ReasoningFabricGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlReasoningFabricCapability], { name: 'reasoningFabricCapabilities' })
  reasoningFabricCapabilities: Promise<GqlReasoningFabricCapability[]> {
    return this.queries.execute(new ListReasoningFabricCapabilitiesQuery);
  }

  @Query( => [GqlReasoningFabricRoute], { name: 'reasoningFabricRoutes' })
  reasoningFabricRoutes: Promise<GqlReasoningFabricRoute[]> {
    return this.queries.execute(new ListReasoningFabricRoutesQuery);
  }
}

import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import {
  ListAgentFabricCapabilitiesQuery,
  ListAgentFabricRoutesQuery,
} from '../agent-fabric/application/messages';
import { GqlAgentFabricCapability, GqlAgentFabricRoute } from './gql.types';

@Resolver()
export class AgentFabricGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlAgentFabricCapability], { name: 'agentFabricCapabilities' })
  agentFabricCapabilities(): Promise<GqlAgentFabricCapability[]> {
    return this.queries.execute(new ListAgentFabricCapabilitiesQuery());
  }

  @Query(() => [GqlAgentFabricRoute], { name: 'agentFabricRoutes' })
  agentFabricRoutes(): Promise<GqlAgentFabricRoute[]> {
    return this.queries.execute(new ListAgentFabricRoutesQuery());
  }
}

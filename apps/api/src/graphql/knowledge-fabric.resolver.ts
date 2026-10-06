import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import {
  ListKnowledgeFabricCapabilitiesQuery,
  ListKnowledgeFabricRoutesQuery,
} from '../knowledge-fabric/application/messages';
import { GqlKnowledgeFabricCapability, GqlKnowledgeFabricRoute } from './gql.types';

@Resolver()
export class KnowledgeFabricGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlKnowledgeFabricCapability], { name: 'knowledgeFabricCapabilities' })
  knowledgeFabricCapabilities(): Promise<GqlKnowledgeFabricCapability[]> {
    return this.queries.execute(new ListKnowledgeFabricCapabilitiesQuery());
  }

  @Query(() => [GqlKnowledgeFabricRoute], { name: 'knowledgeFabricRoutes' })
  knowledgeFabricRoutes(): Promise<GqlKnowledgeFabricRoute[]> {
    return this.queries.execute(new ListKnowledgeFabricRoutesQuery());
  }
}

import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListAtlasCapabilitiesQuery } from '../atlas/application/messages';
import { GqlAtlasCapability } from './gql.types';

@Resolver()
export class AtlasGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlAtlasCapability], { name: 'atlasCapabilities' })
  atlasCapabilities(): Promise<GqlAtlasCapability[]> {
    return this.queries.execute(new ListAtlasCapabilitiesQuery());
  }
}

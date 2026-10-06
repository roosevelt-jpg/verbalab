import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListModelRegistryCapabilitiesQuery } from '../model-registry/application/messages';
import { GqlModelRegistryCapability } from './gql.types';

@Resolver()
export class ModelRegistryGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlModelRegistryCapability], { name: 'modelRegistryCapabilities' })
  modelRegistryCapabilities(): Promise<GqlModelRegistryCapability[]> {
    return this.queries.execute(new ListModelRegistryCapabilitiesQuery());
  }
}

import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import {
  ListPolicyFabricCapabilitiesQuery,
  ListPolicyFabricRoutesQuery,
} from '../policy-fabric/application/messages';
import { GqlPolicyFabricCapability, GqlPolicyFabricRoute } from './gql.types';

@Resolver
export class PolicyFabricGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlPolicyFabricCapability], { name: 'policyFabricCapabilities' })
  policyFabricCapabilities: Promise<GqlPolicyFabricCapability[]> {
    return this.queries.execute(new ListPolicyFabricCapabilitiesQuery);
  }

  @Query( => [GqlPolicyFabricRoute], { name: 'policyFabricRoutes' })
  policyFabricRoutes: Promise<GqlPolicyFabricRoute[]> {
    return this.queries.execute(new ListPolicyFabricRoutesQuery);
  }
}

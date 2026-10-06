import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalPolicyEngineEngineQuery } from '../global-policy-engine/application/messages';
import { GqlGlobalPolicyEngineEngine } from './gql.types';

@Resolver
export class GlobalPolicyEngineGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlGlobalPolicyEngineEngine, { name: 'globalPolicyEngineEngine' })
  async globalPolicyEngineEngine: Promise<GqlGlobalPolicyEngineEngine> {
    const catalog = await this.queries.execute(new GetGlobalPolicyEngineEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      policyRuntimeIntegrated: catalog.honesty.policyRuntimeIntegrated,
      leastPrivilegeRequired: catalog.honesty.leastPrivilegeRequired,
    };
  }
}

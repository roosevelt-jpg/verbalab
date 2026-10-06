import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetSupplyChainSecurityEngineQuery } from '../supply-chain-security/application/messages';
import { GqlSupplyChainSecurityEngine } from './gql.types';

@Resolver
export class SupplyChainSecurityGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlSupplyChainSecurityEngine, { name: 'supplyChainSecurityEngine' })
  async supplyChainSecurityEngine: Promise<GqlSupplyChainSecurityEngine> {
    const catalog = await this.queries.execute(new GetSupplyChainSecurityEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      snykOs: catalog.honesty.snykOs,
      findingCount: Array.isArray(catalog.findings) ? catalog.findings.length : 0,
    };
  }
}

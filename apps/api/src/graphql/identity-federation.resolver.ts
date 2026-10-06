import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetIdentityFederationEngineQuery } from '../identity-federation/application/messages';
import { GqlIdentityFederationEngine } from './gql.types';

@Resolver
export class IdentityFederationGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlIdentityFederationEngine, { name: 'identityFederationEngine' })
  async identityFederationEngine: Promise<GqlIdentityFederationEngine> {
    const catalog = await this.queries.execute(new GetIdentityFederationEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      oktaOs: catalog.honesty.oktaOs,
    };
  }
}

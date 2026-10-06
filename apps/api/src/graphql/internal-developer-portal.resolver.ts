import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetInternalDeveloperPortalEngineQuery } from '../internal-developer-portal/application/messages';
import { GqlInternalDeveloperPortalEngine } from './gql.types';

@Resolver
export class InternalDeveloperPortalGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlInternalDeveloperPortalEngine, { name: 'internalDeveloperPortalEngine' })
  async internalDeveloperPortalEngine: Promise<GqlInternalDeveloperPortalEngine> {
    const catalog = await this.queries.execute(new GetInternalDeveloperPortalEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      backstageOs: catalog.honesty.backstageOs,
    };
  }
}

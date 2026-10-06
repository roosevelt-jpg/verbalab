import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetServiceCatalogEngineQuery } from '../service-catalog/application/messages';
import { GqlServiceCatalogEngine } from './gql.types';

@Resolver()
export class ServiceCatalogGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlServiceCatalogEngine, { name: 'serviceCatalogEngine' })
  async serviceCatalogEngine(): Promise<GqlServiceCatalogEngine> {
    const catalog = await this.queries.execute(new GetServiceCatalogEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      serviceMeshOs: catalog.honesty.serviceMeshOs,
    };
  }
}

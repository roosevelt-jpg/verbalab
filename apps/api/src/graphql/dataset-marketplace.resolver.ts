import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetDatasetMarketplaceEngineQuery } from '../dataset-marketplace/application/messages';
import {
  GqlDatasetMarketplaceCapability,
  GqlDatasetMarketplaceEngine,
} from './gql.types';

@Resolver()
export class DatasetMarketplaceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlDatasetMarketplaceEngine, { name: 'datasetMarketplaceEngine' })
  async datasetMarketplaceEngine(): Promise<GqlDatasetMarketplaceEngine> {
    const catalog = await this.queries.execute(new GetDatasetMarketplaceEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlDatasetMarketplaceCapability[],
      labelStudioOs: catalog.honesty.labelStudioOs,
      datasetCloudOs: catalog.honesty.datasetCloudOs,
      storesRawCardData: catalog.honesty.storesRawCardData,
      stripeOrEquivalentRequired: catalog.honesty.stripeOrEquivalentRequired,
    };
  }
}

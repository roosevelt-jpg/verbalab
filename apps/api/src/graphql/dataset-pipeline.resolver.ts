import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetDatasetPipelineEngineQuery } from '../dataset-pipeline/application/messages';
import { GqlDatasetPipelineEngine } from './gql.types';

@Resolver()
export class DatasetPipelineGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlDatasetPipelineEngine, { name: 'datasetPipelineEngine' })
  async datasetPipelineEngine(): Promise<GqlDatasetPipelineEngine> {
    const catalog = await this.queries.execute(new GetDatasetPipelineEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      regeneratesDatasetMarketplace: catalog.honesty.regeneratesDatasetMarketplace,
    };
  }
}

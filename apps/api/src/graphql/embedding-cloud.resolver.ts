import { Query, Resolver } from '@nestjs/graphql';
import { EmbeddingCloudService } from '../embedding-cloud/embedding-cloud.service';
import { GqlEmbeddingCloudEngine } from './gql.types';

@Resolver
export class EmbeddingCloudGraphqlResolver {
  constructor(private readonly embeddingCloud: EmbeddingCloudService) {}

  @Query( => GqlEmbeddingCloudEngine, { name: 'embeddingCloudEngine' })
  embeddingCloudEngine: GqlEmbeddingCloudEngine {
    const c = this.embeddingCloud.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      trainsEmbeddingModels: c.honesty.trainsEmbeddingModels,
      multimodalOs: c.honesty.multimodalOs,
    };
  }
}

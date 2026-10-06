import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetEmbeddingRuntimeEngineQuery } from '../embedding-runtime/application/messages';
import { GqlEmbeddingRuntimeEngine } from './gql.types';

@Resolver
export class EmbeddingRuntimeGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlEmbeddingRuntimeEngine, { name: 'embeddingRuntimeEngine' })
  async embeddingRuntimeEngine: Promise<GqlEmbeddingRuntimeEngine> {
    const catalog = await this.queries.execute(new GetEmbeddingRuntimeEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      thinExecutionLayer: catalog.honesty.thinExecutionLayer,
      duplicatesProductLogic: catalog.honesty.duplicatesProductLogic,
      managesOrgsPoliciesBilling: catalog.honesty.managesOrgsPoliciesBilling,
      serviceMeshOs: catalog.honesty.serviceMeshOs,
    };
  }
}

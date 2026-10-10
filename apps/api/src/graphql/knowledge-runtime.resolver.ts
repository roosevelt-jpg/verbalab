import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetKnowledgeRuntimeEngineQuery } from '../knowledge-runtime/application/messages';
import { GqlKnowledgeRuntimeEngine } from './gql.types';

@Resolver()
export class KnowledgeRuntimeGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlKnowledgeRuntimeEngine, { name: 'knowledgeRuntimeEngine' })
  async knowledgeRuntimeEngine(): Promise<GqlKnowledgeRuntimeEngine> {
    const catalog = await this.queries.execute(new GetKnowledgeRuntimeEngineQuery());
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

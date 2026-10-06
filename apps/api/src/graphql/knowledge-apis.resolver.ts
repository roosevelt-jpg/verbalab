import { Query, Resolver } from '@nestjs/graphql';
import { KnowledgeApisService } from '../knowledge-apis/knowledge-apis.service';
import { GqlKnowledgeApisEngine } from './gql.types';

@Resolver()
export class KnowledgeApisGraphqlResolver {
  constructor(private readonly knowledgeApis: KnowledgeApisService) {}

  @Query(() => GqlKnowledgeApisEngine, { name: 'knowledgeApisEngine' })
  knowledgeApisEngine(): GqlKnowledgeApisEngine {
    const c = this.knowledgeApis.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      grpcOs: c.honesty.grpcOs,
      kafkaEventStreamingOs: c.honesty.kafkaEventStreamingOs,
      sdkGeneratorOs: c.honesty.sdkGeneratorOs,
      extendsExistingKnowledgeApis: c.honesty.extendsExistingKnowledgeApis,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
    };
  }
}

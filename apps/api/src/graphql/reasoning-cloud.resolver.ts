import { Query, Resolver } from '@nestjs/graphql';
import { ReasoningCloudService } from '../reasoning-cloud/reasoning-cloud.service';
import { GqlReasoningCloudEngine } from './gql.types';

@Resolver
export class ReasoningCloudGraphqlResolver {
  constructor(private readonly reasoningCloud: ReasoningCloudService) {}

  @Query( => GqlReasoningCloudEngine, { name: 'reasoningCloudEngine' })
  reasoningCloudEngine: GqlReasoningCloudEngine {
    const c = this.reasoningCloud.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      customReasonerKernel: c.honesty.customReasonerKernel,
      symbolicReasonerOs: c.honesty.symbolicReasonerOs,
      llmGateway: c.honesty.llmGateway,
    };
  }
}

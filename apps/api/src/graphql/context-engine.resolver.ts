import { Query, Resolver } from '@nestjs/graphql';
import { ContextEngineService } from '../context-engine/context-engine.service';
import { GqlContextEngine } from './gql.types';

@Resolver()
export class ContextEngineGraphqlResolver {
  constructor(private readonly contextEngine: ContextEngineService) {}

  @Query(() => GqlContextEngine, { name: 'contextEngine' })
  contextEngineQuery(): GqlContextEngine {
    const c = this.contextEngine.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      infiniteContextWindow: c.honesty.infiniteContextWindow,
      llmSummarization: c.honesty.llmSummarization,
      realtimePush: c.honesty.realtimePush,
    };
  }
}

import { Query, Resolver } from '@nestjs/graphql';
import { PromptIntelligenceService } from '../prompt-intelligence/prompt-intelligence.service';
import { GqlPromptIntelligence } from './gql.types';

@Resolver
export class PromptIntelligenceGraphqlResolver {
  constructor(private readonly promptIntel: PromptIntelligenceService) {}

  @Query( => GqlPromptIntelligence, { name: 'promptIntelligence' })
  promptIntelligence: GqlPromptIntelligence {
    const c = this.promptIntel.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      autoPromptResearchLab: c.honesty.autoPromptResearchLab,
      trainsPromptOptimizers: c.honesty.trainsPromptOptimizers,
      extendsVersionedPrompts: c.honesty.extendsVersionedPrompts,
    };
  }
}

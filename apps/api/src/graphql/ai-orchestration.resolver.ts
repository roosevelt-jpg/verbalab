import { Query, Resolver } from '@nestjs/graphql';
import { AiOrchestrationService } from '../ai-orchestration/ai-orchestration.service';
import { GqlAiOrchestration } from './gql.types';

@Resolver
export class AiOrchestrationGraphqlResolver {
  constructor(private readonly orchestration: AiOrchestrationService) {}

  @Query( => GqlAiOrchestration, { name: 'aiOrchestration' })
  aiOrchestration: GqlAiOrchestration {
    const c = this.orchestration.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      multiCloudAgentOs: c.honesty.multiCloudAgentOs,
      langGraphOs: c.honesty.langGraphOs,
      loadBearingE2e: c.honesty.loadBearingE2e,
    };
  }
}

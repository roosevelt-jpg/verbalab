import { Query, Resolver } from '@nestjs/graphql';
import { AiRouterService } from '../ai-router/ai-router.service';
import { GqlAiRouterEngine } from './gql.types';

@Resolver()
export class AiRouterGraphqlResolver {
  constructor(private readonly router: AiRouterService) {}

  @Query(() => GqlAiRouterEngine, { name: 'aiRouterEngine' })
  aiRouterEngine(): GqlAiRouterEngine {
    const c = this.router.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      serviceMeshOs: c.honesty.serviceMeshOs,
      multiCloudRouterOs: c.honesty.multiCloudRouterOs,
      regeneratesAiGateway: c.honesty.regeneratesAiGateway,
      extendsAiGateway: c.honesty.extendsAiGateway,
      extendsModelServing: c.honesty.extendsModelServing,
      dryRunResolveOnly: c.honesty.dryRunResolveOnly,
      enforcesSpendCaps: c.honesty.enforcesSpendCaps,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      primaryRegion: c.honesty.primaryRegion,
      mode: c.mode,
    };
  }
}

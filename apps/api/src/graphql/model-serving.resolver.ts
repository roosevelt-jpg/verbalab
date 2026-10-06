import { Query, Resolver } from '@nestjs/graphql';
import { ModelServingService } from '../model-serving/model-serving.service';
import { GqlModelServingEngine } from './gql.types';

@Resolver()
export class ModelServingGraphqlResolver {
  constructor(private readonly serving: ModelServingService) {}

  @Query(() => GqlModelServingEngine, { name: 'modelServingEngine' })
  modelServingEngine(): GqlModelServingEngine {
    const c = this.serving.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      vllmOs: c.honesty.vllmOs,
      kserveOs: c.honesty.kserveOs,
      tritonOs: c.honesty.tritonOs,
      selfHostedGpuServingOs: c.honesty.selfHostedGpuServingOs,
      regeneratesAiGateway: c.honesty.regeneratesAiGateway,
      extendsAiGateway: c.honesty.extendsAiGateway,
      extendsModelRegistry: c.honesty.extendsModelRegistry,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      sandboxDeploymentsOnly: c.honesty.sandboxDeploymentsOnly,
      maxActiveDeployments: c.ceilings.maxActiveDeployments,
      servingMode: c.ceilings.mode,
    };
  }
}

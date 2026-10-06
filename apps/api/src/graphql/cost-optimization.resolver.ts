import { Query, Resolver } from '@nestjs/graphql';
import { CostOptimizationService } from '../cost-optimization/cost-optimization.service';
import { GqlCostOptimizationEngine } from './gql.types';

@Resolver()
export class CostOptimizationGraphqlResolver {
  constructor(private readonly cost: CostOptimizationService) {}

  @Query(() => GqlCostOptimizationEngine, { name: 'costOptimizationEngine' })
  costOptimizationEngine(): GqlCostOptimizationEngine {
    const c = this.cost.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      finOpsOs: c.honesty.finOpsOs,
      cloudSpotApis: c.honesty.cloudSpotApis,
      reservedInstanceMarketplace: c.honesty.reservedInstanceMarketplace,
      openEndedAutoscale: c.honesty.openEndedAutoscale,
      regeneratesAiGateway: c.honesty.regeneratesAiGateway,
      enforcesSpendCaps: c.honesty.enforcesSpendCaps,
      reportOnly: c.honesty.reportOnly,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      extendsGpuPlatform: c.honesty.extendsGpuPlatform,
      extendsAiRouter: c.honesty.extendsAiRouter,
      mode: c.mode,
      defaultDailyCapUsd: c.ceilings.defaultDailyCapUsd,
      defaultMonthlyCapUsd: c.ceilings.defaultMonthlyCapUsd,
    };
  }
}

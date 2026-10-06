import { Query, Resolver } from '@nestjs/graphql';
import { BatchRuntimeService } from '../batch-runtime/batch-runtime.service';
import { GqlBatchRuntimeEngine } from './gql.types';

@Resolver()
export class BatchRuntimeGraphqlResolver {
  constructor(private readonly batch: BatchRuntimeService) {}

  @Query(() => GqlBatchRuntimeEngine, { name: 'batchRuntimeEngine' })
  batchRuntimeEngine(): GqlBatchRuntimeEngine {
    const c = this.batch.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      sparkOs: c.honesty.sparkOs,
      airflowOs: c.honesty.airflowOs,
      celeryOs: c.honesty.celeryOs,
      distributedBatchOs: c.honesty.distributedBatchOs,
      regeneratesJobsApi: c.honesty.regeneratesJobsApi,
      extendsBullMqJobs: c.honesty.extendsBullMqJobs,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      sandboxRunsForNonTranslate: c.honesty.sandboxRunsForNonTranslate,
      mode: c.mode,
      maxItemsPerRun: c.ceilings.maxItemsPerRun,
      maxRetries: c.ceilings.maxRetries,
    };
  }
}

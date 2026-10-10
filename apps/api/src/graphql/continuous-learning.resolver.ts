import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetContinuousLearningEngineQuery } from '../continuous-learning/application/messages';
import { GqlContinuousLearningEngine } from './gql.types';

@Resolver()
export class ContinuousLearningGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlContinuousLearningEngine, { name: 'continuousLearningEngine' })
  async continuousLearningEngine(): Promise<GqlContinuousLearningEngine> {
    const catalog = await this.queries.execute(new GetContinuousLearningEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      humanApprovalRequiredBeforePromote: catalog.honesty.humanApprovalRequiredBeforePromote,
    };
  }
}

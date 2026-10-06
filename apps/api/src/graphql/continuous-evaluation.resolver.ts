import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetContinuousEvaluationEngineQuery } from '../continuous-evaluation/application/messages';
import { GqlContinuousEvaluationEngine } from './gql.types';

@Resolver
export class ContinuousEvaluationGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlContinuousEvaluationEngine, { name: 'continuousEvaluationEngine' })
  async continuousEvaluationEngine: Promise<GqlContinuousEvaluationEngine> {
    const catalog = await this.queries.execute(new GetContinuousEvaluationEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      continuousEvalPass: catalog.continuousEvalPass,
    };
  }
}

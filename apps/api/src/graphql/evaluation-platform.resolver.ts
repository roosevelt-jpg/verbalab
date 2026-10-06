import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetEvaluationPlatformEngineQuery } from '../evaluation-platform/application/messages';
import { GqlEvaluationPlatformEngine } from './gql.types';

@Resolver
export class EvaluationPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlEvaluationPlatformEngine, { name: 'evaluationPlatformEngine' })
  async evaluationPlatformEngine: Promise<GqlEvaluationPlatformEngine> {
    const catalog = await this.queries.execute(new GetEvaluationPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      regeneratesModelEvaluationPlatform: catalog.honesty.regeneratesModelEvaluationPlatform,
    };
  }
}

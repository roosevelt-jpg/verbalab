import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListModelEvaluationSuitesQuery } from '../model-evaluation-platform/application/messages';
import { GqlModelEvaluationSuite } from './gql.types';

@Resolver
export class ModelEvaluationPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlModelEvaluationSuite], { name: 'modelEvaluationSuites' })
  modelEvaluationSuites: Promise<GqlModelEvaluationSuite[]> {
    return this.queries.execute(new ListModelEvaluationSuitesQuery);
  }
}

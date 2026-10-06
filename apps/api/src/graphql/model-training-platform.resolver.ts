import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListModelTrainingMethodsQuery } from '../model-training-platform/application/messages';
import { GqlModelTrainingMethod } from './gql.types';

@Resolver()
export class ModelTrainingPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlModelTrainingMethod], { name: 'modelTrainingMethods' })
  modelTrainingMethods(): Promise<GqlModelTrainingMethod[]> {
    return this.queries.execute(new ListModelTrainingMethodsQuery());
  }
}

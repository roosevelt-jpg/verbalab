import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetTrainingPipelineEngineQuery } from '../training-pipeline/application/messages';
import { GqlTrainingPipelineEngine } from './gql.types';

@Resolver
export class TrainingPipelineGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlTrainingPipelineEngine, { name: 'trainingPipelineEngine' })
  async trainingPipelineEngine: Promise<GqlTrainingPipelineEngine> {
    const catalog = await this.queries.execute(new GetTrainingPipelineEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      distributedTrainingOs: catalog.honesty.distributedTrainingOs,
    };
  }
}

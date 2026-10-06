import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiDriftDetectionEngineQuery } from '../ai-drift-detection/application/messages';
import { GqlAiDriftDetectionEngine } from './gql.types';

@Resolver
export class AiDriftDetectionGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlAiDriftDetectionEngine, { name: 'aiDriftDetectionEngine' })
  async aiDriftDetectionEngine: Promise<GqlAiDriftDetectionEngine> {
    const catalog = await this.queries.execute(new GetAiDriftDetectionEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      driftClear: catalog.driftClear,
    };
  }
}

import { Query, Resolver } from '@nestjs/graphql';
import { RecommendationEngineService } from '../recommendation-engine/recommendation-engine.service';
import { GqlRecommendationEngine } from './gql.types';

@Resolver
export class RecommendationEngineGraphqlResolver {
  constructor(private readonly recommendations: RecommendationEngineService) {}

  @Query( => GqlRecommendationEngine, { name: 'recommendationEngine' })
  recommendationEngine: GqlRecommendationEngine {
    const c = this.recommendations.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      retailRecommenderOs: c.honesty.retailRecommenderOs,
      collaborativeFiltering: c.honesty.collaborativeFiltering,
      lightRankers: c.honesty.lightRankers,
    };
  }
}

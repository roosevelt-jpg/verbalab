import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetRiskIntelligenceEngineQuery } from '../risk-intelligence/application/messages';
import { GqlRiskIntelligenceEngine } from './gql.types';

@Resolver
export class RiskIntelligenceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlRiskIntelligenceEngine, { name: 'riskIntelligenceEngine' })
  async riskIntelligenceEngine: Promise<GqlRiskIntelligenceEngine> {
    const catalog = await this.queries.execute(new GetRiskIntelligenceEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      grcSuiteOs: catalog.honesty.grcSuiteOs,
    };
  }
}

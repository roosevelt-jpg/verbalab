import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetHealthcareIntelligenceEngineQuery } from '../healthcare-intelligence/application/messages';
import { GqlHealthcareIntelligenceEngine } from './gql.types';

@Resolver()
export class HealthcareIntelligenceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlHealthcareIntelligenceEngine, { name: 'healthcareIntelligenceEngine' })
  async healthcareIntelligenceEngine(): Promise<GqlHealthcareIntelligenceEngine> {
    const catalog = await this.queries.execute(new GetHealthcareIntelligenceEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      notMedicalAdvice: catalog.honesty.notMedicalAdvice,
    };
  }
}

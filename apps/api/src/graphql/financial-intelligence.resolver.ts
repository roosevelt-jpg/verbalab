import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetFinancialIntelligenceEngineQuery } from '../financial-intelligence/application/messages';
import { GqlFinancialIntelligenceEngine } from './gql.types';

@Resolver()
export class FinancialIntelligenceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlFinancialIntelligenceEngine, { name: 'financialIntelligenceEngine' })
  async financialIntelligenceEngine(): Promise<GqlFinancialIntelligenceEngine> {
    const catalog = await this.queries.execute(new GetFinancialIntelligenceEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      notInvestmentAdvice: catalog.honesty.notInvestmentAdvice,
    };
  }
}

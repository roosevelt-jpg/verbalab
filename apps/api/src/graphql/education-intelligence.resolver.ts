import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetEducationIntelligenceEngineQuery } from '../education-intelligence/application/messages';
import { GqlEducationIntelligenceEngine } from './gql.types';

@Resolver()
export class EducationIntelligenceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlEducationIntelligenceEngine, { name: 'educationIntelligenceEngine' })
  async educationIntelligenceEngine(): Promise<GqlEducationIntelligenceEngine> {
    const catalog = await this.queries.execute(new GetEducationIntelligenceEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      verticalOperationsOs: catalog.honesty.verticalOperationsOs,
    };
  }
}

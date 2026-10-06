import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetEngineeringQualityPlatformEngineQuery } from '../engineering-quality-platform/application/messages';
import { GqlEngineeringQualityPlatformEngine } from './gql.types';

@Resolver()
export class EngineeringQualityPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlEngineeringQualityPlatformEngine, { name: 'engineeringQualityPlatformEngine' })
  async engineeringQualityPlatformEngine(): Promise<GqlEngineeringQualityPlatformEngine> {
    const catalog = await this.queries.execute(new GetEngineeringQualityPlatformEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      engineeringOsForHumansAndCursor: catalog.honesty.engineeringOsForHumansAndCursor,
      customerFacingProductCloud: catalog.honesty.customerFacingProductCloud,
      architectureKnowledgeBaseOs: catalog.honesty.architectureKnowledgeBaseOs,
      adrFactoryOs: catalog.honesty.adrFactoryOs,
    };
  }
}

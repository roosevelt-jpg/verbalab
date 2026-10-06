import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetPatentInnovationPlatformEngineQuery } from '../patent-innovation-platform/application/messages';
import { GqlPatentInnovationPlatformEngine } from './gql.types';

@Resolver
export class PatentInnovationPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlPatentInnovationPlatformEngine, { name: 'patentInnovationPlatformEngine' })
  async patentInnovationPlatformEngine: Promise<GqlPatentInnovationPlatformEngine> {
    const catalog = await this.queries.execute(new GetPatentInnovationPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      usptoOs: catalog.honesty.usptoOs,
    };
  }
}

import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiPublicationPlatformEngineQuery } from '../ai-publication-platform/application/messages';
import { GqlAiPublicationPlatformEngine } from './gql.types';

@Resolver()
export class AiPublicationPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiPublicationPlatformEngine, { name: 'aiPublicationPlatformEngine' })
  async aiPublicationPlatformEngine(): Promise<GqlAiPublicationPlatformEngine> {
    const catalog = await this.queries.execute(new GetAiPublicationPlatformEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      doiRegistryOs: catalog.honesty.doiRegistryOs,
    };
  }
}

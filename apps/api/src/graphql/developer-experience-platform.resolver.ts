import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetDeveloperExperiencePlatformEngineQuery } from '../developer-experience-platform/application/messages';
import { GqlDeveloperExperiencePlatformEngine } from './gql.types';

@Resolver
export class DeveloperExperiencePlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlDeveloperExperiencePlatformEngine, { name: 'developerExperiencePlatformEngine' })
  async developerExperiencePlatformEngine: Promise<GqlDeveloperExperiencePlatformEngine> {
    const catalog = await this.queries.execute(new GetDeveloperExperiencePlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      ideOs: catalog.honesty.ideOs,
    };
  }
}

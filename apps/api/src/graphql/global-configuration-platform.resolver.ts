import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalConfigurationPlatformEngineQuery } from '../global-configuration-platform/application/messages';
import { GqlGlobalConfigurationPlatformEngine } from './gql.types';

@Resolver
export class GlobalConfigurationPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlGlobalConfigurationPlatformEngine, { name: 'globalConfigurationPlatformEngine' })
  async globalConfigurationPlatformEngine: Promise<GqlGlobalConfigurationPlatformEngine> {
    const catalog = await this.queries.execute(new GetGlobalConfigurationPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      secretsRefsOnly: catalog.honesty.secretsRefsOnly,
    };
  }
}

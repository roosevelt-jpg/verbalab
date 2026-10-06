import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAfricanLanguageRegistryEngineQuery } from '../african-language-registry/application/messages';
import { GqlAfricanLanguageRegistryEngine } from './gql.types';

@Resolver
export class AfricanLanguageRegistryGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlAfricanLanguageRegistryEngine, { name: 'africanLanguageRegistryEngine' })
  async africanLanguageRegistryEngine: Promise<GqlAfricanLanguageRegistryEngine> {
    const catalog = await this.queries.execute(new GetAfricanLanguageRegistryEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      coverageComplete: catalog.honesty.coverageComplete,
    };
  }
}

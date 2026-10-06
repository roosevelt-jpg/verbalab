import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGitopsPlatformEngineQuery } from '../gitops-platform/application/messages';
import { GqlGitopsPlatformEngine } from './gql.types';

@Resolver
export class GitopsPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlGitopsPlatformEngine, { name: 'gitopsPlatformEngine' })
  async gitopsPlatformEngine: Promise<GqlGitopsPlatformEngine> {
    const catalog = await this.queries.execute(new GetGitopsPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      argoCdOs: catalog.honesty.argoCdOs,
      fluxOs: catalog.honesty.fluxOs,
    };
  }
}

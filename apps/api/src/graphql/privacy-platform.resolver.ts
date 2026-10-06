import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetPrivacyPlatformEngineQuery } from '../privacy-platform/application/messages';
import { GqlPrivacyPlatformEngine } from './gql.types';

@Resolver
export class PrivacyPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlPrivacyPlatformEngine, { name: 'privacyPlatformEngine' })
  async privacyPlatformEngine: Promise<GqlPrivacyPlatformEngine> {
    const catalog = await this.queries.execute(new GetPrivacyPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      traditionalKnowledgeConsentRequired: catalog.honesty.traditionalKnowledgeConsentRequired,
    };
  }
}

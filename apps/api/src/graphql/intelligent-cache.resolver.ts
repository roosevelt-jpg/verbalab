import { Query, Resolver } from '@nestjs/graphql';
import { IntelligentCacheService } from '../intelligent-cache/intelligent-cache.service';
import { GqlIntelligentCacheEngine } from './gql.types';

@Resolver
export class IntelligentCacheGraphqlResolver {
  constructor(private readonly cache: IntelligentCacheService) {}

  @Query( => GqlIntelligentCacheEngine, { name: 'intelligentCacheEngine' })
  intelligentCacheEngine: GqlIntelligentCacheEngine {
    const c = this.cache.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      redisClusterOs: c.honesty.redisClusterOs,
      vectorSemanticOs: c.honesty.vectorSemanticOs,
      cdnOs: c.honesty.cdnOs,
      autoWiresGatewayResponses: c.honesty.autoWiresGatewayResponses,
      regeneratesAiGateway: c.honesty.regeneratesAiGateway,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      sandboxEntries: c.honesty.sandboxEntries,
      exactKeyLookup: c.honesty.exactKeyLookup,
      mode: c.mode,
      maxEntriesPerWorkspace: c.ceilings.maxEntriesPerWorkspace,
      defaultTtlSec: c.ceilings.defaultTtlSec,
    };
  }
}

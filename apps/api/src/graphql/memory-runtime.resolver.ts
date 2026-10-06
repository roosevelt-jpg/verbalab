import { Query, Resolver } from '@nestjs/graphql';
import { MemoryRuntimeService } from '../memory-runtime/memory-runtime.service';
import { GqlMemoryRuntimeEngine } from './gql.types';

@Resolver()
export class MemoryRuntimeGraphqlResolver {
  constructor(private readonly runtime: MemoryRuntimeService) {}

  @Query(() => GqlMemoryRuntimeEngine, { name: 'memoryRuntimeEngine' })
  memoryRuntimeEngine(): GqlMemoryRuntimeEngine {
    const c = this.runtime.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      mem0Os: c.honesty.mem0Os,
      infinitePersonalizationOs: c.honesty.infinitePersonalizationOs,
      replicationOs: c.honesty.replicationOs,
      encryptionKmsOs: c.honesty.encryptionKmsOs,
      regeneratesMemoryCloud: c.honesty.regeneratesMemoryCloud,
      regeneratesKnowledgeMemory: c.honesty.regeneratesKnowledgeMemory,
      extendsMemoryCloud: c.honesty.extendsMemoryCloud,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      kernelLayerOnly: c.honesty.kernelLayerOnly,
      vectorSemanticOs: c.honesty.vectorSemanticOs,
      mode: c.mode,
      maxEntriesPerWorkspace: c.ceilings.maxEntriesPerWorkspace,
    };
  }
}

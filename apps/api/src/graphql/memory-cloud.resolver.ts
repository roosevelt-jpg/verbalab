import { Query, Resolver } from '@nestjs/graphql';
import { MemoryCloudService } from '../memory-cloud/memory-cloud.service';
import { GqlMemoryCloudEngine } from './gql.types';

@Resolver()
export class MemoryCloudGraphqlResolver {
  constructor(private readonly memoryCloud: MemoryCloudService) {}

  @Query(() => GqlMemoryCloudEngine, { name: 'memoryCloudEngine' })
  memoryCloudEngine(): GqlMemoryCloudEngine {
    const c = this.memoryCloud.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      infinitePersonalizationOs: c.honesty.infinitePersonalizationOs,
      gdprExport: c.honesty.gdprExport,
      gdprErase: c.honesty.gdprErase,
    };
  }
}

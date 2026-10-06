import { Query, Resolver } from '@nestjs/graphql';
import { VectorCloudService } from '../vector-cloud/vector-cloud.service';
import { GqlVectorCloudEngine } from './gql.types';

@Resolver
export class VectorCloudGraphqlResolver {
  constructor(private readonly vectorCloud: VectorCloudService) {}

  @Query( => GqlVectorCloudEngine, { name: 'vectorCloudEngine' })
  vectorCloudEngine: GqlVectorCloudEngine {
    const c = this.vectorCloud.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      managedVectorDbOs: c.honesty.managedVectorDbOs,
      pineconeParity: c.honesty.pineconeParity,
      hybridBm25: c.honesty.hybridBm25,
    };
  }
}

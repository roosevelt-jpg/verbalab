import { Query, Resolver } from '@nestjs/graphql';
import { ModelsService } from '../models/models.service';
import { GqlCatalogCapability, GqlModelsEngine } from './gql.types';

@Resolver()
export class ModelsEngineGraphqlResolver {
  constructor(private readonly models: ModelsService) {}

  @Query(() => GqlModelsEngine, { name: 'modelsEngine' })
  modelsEngine(): GqlModelsEngine {
    const catalog = this.models.engine();
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlCatalogCapability[],
    };
  }
}

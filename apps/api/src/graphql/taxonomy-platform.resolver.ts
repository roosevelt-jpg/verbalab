import { Query, Resolver } from '@nestjs/graphql';
import { TaxonomyPlatformService } from '../taxonomy-platform/taxonomy-platform.service';
import { GqlTaxonomyEngine } from './gql.types';

@Resolver()
export class TaxonomyPlatformGraphqlResolver {
  constructor(private readonly taxonomy: TaxonomyPlatformService) {}

  @Query(() => GqlTaxonomyEngine, { name: 'taxonomyEngine' })
  taxonomyEngine(): GqlTaxonomyEngine {
    const c = this.taxonomy.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      enterpriseTaxonomyOs: c.honesty.enterpriseTaxonomyOs,
      mlAutoClassification: c.honesty.mlAutoClassification,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
    };
  }
}

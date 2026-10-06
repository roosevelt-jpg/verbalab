import { Query, Resolver } from '@nestjs/graphql';
import { EnterpriseSearchService } from '../enterprise-search/enterprise-search.service';
import { GqlEnterpriseSearchEngine } from './gql.types';

@Resolver()
export class EnterpriseSearchGraphqlResolver {
  constructor(private readonly enterpriseSearch: EnterpriseSearchService) {}

  @Query(() => GqlEnterpriseSearchEngine, { name: 'enterpriseSearchEngine' })
  enterpriseSearchEngine(): GqlEnterpriseSearchEngine {
    const c = this.enterpriseSearch.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      elasticOs: c.honesty.elasticOs,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      extendsVl062: c.honesty.extendsVl062,
    };
  }
}

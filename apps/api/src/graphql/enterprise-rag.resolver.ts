import { Query, Resolver } from '@nestjs/graphql';
import { EnterpriseRagService } from '../enterprise-rag/enterprise-rag.service';
import { GqlEnterpriseRagEngine } from './gql.types';

@Resolver()
export class EnterpriseRagGraphqlResolver {
  constructor(private readonly enterpriseRag: EnterpriseRagService) {}

  @Query(() => GqlEnterpriseRagEngine, { name: 'enterpriseRagEngine' })
  enterpriseRagEngine(): GqlEnterpriseRagEngine {
    const c = this.enterpriseRag.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      langchainOs: c.honesty.langchainOs,
      agenticRagOs: c.honesty.agenticRagOs,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      extendsVl062: c.honesty.extendsVl062,
      handVerifyRequired: c.honesty.handVerifyRequired,
    };
  }
}

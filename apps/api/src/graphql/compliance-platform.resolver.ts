import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetCompliancePlatformEngineQuery } from '../compliance-platform/application/messages';
import { GqlCompliancePlatformEngine } from './gql.types';

@Resolver()
export class CompliancePlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlCompliancePlatformEngine, { name: 'compliancePlatformEngine' })
  async compliancePlatformEngine(): Promise<GqlCompliancePlatformEngine> {
    const catalog = await this.queries.execute(new GetCompliancePlatformEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      complianceToolingNotCertification: catalog.honesty.complianceToolingNotCertification,
    };
  }
}

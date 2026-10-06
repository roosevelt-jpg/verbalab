import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetOrganizationControlEngineQuery } from '../organization-control/application/messages';
import { GqlOrganizationControlEngine } from './gql.types';

@Resolver()
export class OrganizationControlGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlOrganizationControlEngine, { name: 'organizationControlEngine' })
  async organizationControlEngine(): Promise<GqlOrganizationControlEngine> {
    const catalog = await this.queries.execute(new GetOrganizationControlEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      leastPrivilegeRequired: catalog.honesty.leastPrivilegeRequired,
      controlPlaneAdminNotDefault: catalog.honesty.controlPlaneAdminNotDefault,
    };
  }
}

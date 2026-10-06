import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalDeploymentControllerEngineQuery } from '../global-deployment-controller/application/messages';
import { GqlGlobalDeploymentControllerEngine } from './gql.types';

@Resolver()
export class GlobalDeploymentControllerGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlGlobalDeploymentControllerEngine, { name: 'globalDeploymentControllerEngine' })
  async globalDeploymentControllerEngine(): Promise<GqlGlobalDeploymentControllerEngine> {
    const catalog = await this.queries.execute(new GetGlobalDeploymentControllerEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      productionDeployRequiresAuthorization: catalog.honesty.productionDeployRequiresAuthorization,
      rollbackPath: catalog.honesty.rollbackPath,
    };
  }
}

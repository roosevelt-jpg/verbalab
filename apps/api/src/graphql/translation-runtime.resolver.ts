import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetTranslationRuntimeEngineQuery } from '../translation-runtime/application/messages';
import { GqlTranslationRuntimeEngine } from './gql.types';

@Resolver()
export class TranslationRuntimeGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlTranslationRuntimeEngine, { name: 'translationRuntimeEngine' })
  async translationRuntimeEngine(): Promise<GqlTranslationRuntimeEngine> {
    const catalog = await this.queries.execute(new GetTranslationRuntimeEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      thinExecutionLayer: catalog.honesty.thinExecutionLayer,
      duplicatesProductLogic: catalog.honesty.duplicatesProductLogic,
      managesOrgsPoliciesBilling: catalog.honesty.managesOrgsPoliciesBilling,
      serviceMeshOs: catalog.honesty.serviceMeshOs,
    };
  }
}

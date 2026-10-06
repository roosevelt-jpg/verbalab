import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetSpeechRuntimeEngineQuery } from '../speech-runtime/application/messages';
import { GqlSpeechRuntimeEngine } from './gql.types';

@Resolver
export class SpeechRuntimeGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlSpeechRuntimeEngine, { name: 'speechRuntimeEngine' })
  async speechRuntimeEngine: Promise<GqlSpeechRuntimeEngine> {
    const catalog = await this.queries.execute(new GetSpeechRuntimeEngineQuery);
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

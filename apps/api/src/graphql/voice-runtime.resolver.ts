import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetVoiceRuntimeEngineQuery } from '../voice-runtime/application/messages';
import { GqlVoiceRuntimeEngine } from './gql.types';

@Resolver()
export class VoiceRuntimeGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlVoiceRuntimeEngine, { name: 'voiceRuntimeEngine' })
  async voiceRuntimeEngine(): Promise<GqlVoiceRuntimeEngine> {
    const catalog = await this.queries.execute(new GetVoiceRuntimeEngineQuery());
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

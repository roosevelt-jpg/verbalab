import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListVoiceProductsQuery } from '../voice-cloud/application/messages';
import { GqlVoiceProduct } from './gql.types';

@Resolver
export class VoiceCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlVoiceProduct], { name: 'voiceProducts' })
  voiceProducts: Promise<GqlVoiceProduct[]> {
    return this.queries.execute(new ListVoiceProductsQuery);
  }
}

import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListSpeechProductsQuery } from '../speech-cloud/application/messages';
import { GqlSpeechProduct } from './gql.types';

@Resolver()
export class SpeechCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlSpeechProduct], { name: 'speechProducts' })
  speechProducts(): Promise<GqlSpeechProduct[]> {
    return this.queries.execute(new ListSpeechProductsQuery());
  }
}

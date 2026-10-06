import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListAiKernelRuntimesQuery } from '../ai-kernel/application/messages';
import { GqlAiKernelRuntime } from './gql.types';

@Resolver
export class AiKernelGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlAiKernelRuntime], { name: 'aiKernelRuntimes' })
  aiKernelRuntimes: Promise<GqlAiKernelRuntime[]> {
    return this.queries.execute(new ListAiKernelRuntimesQuery);
  }
}

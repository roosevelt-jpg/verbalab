import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import {
  ListEventFabricBrokersQuery,
  ListEventFabricCapabilitiesQuery,
} from '../event-fabric/application/messages';
import { GqlEventFabricBroker, GqlEventFabricCapability } from './gql.types';

@Resolver()
export class EventFabricGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlEventFabricCapability], { name: 'eventFabricCapabilities' })
  eventFabricCapabilities(): Promise<GqlEventFabricCapability[]> {
    return this.queries.execute(new ListEventFabricCapabilitiesQuery());
  }

  @Query(() => [GqlEventFabricBroker], { name: 'eventFabricBrokers' })
  eventFabricBrokers(): Promise<GqlEventFabricBroker[]> {
    return this.queries.execute(new ListEventFabricBrokersQuery());
  }
}

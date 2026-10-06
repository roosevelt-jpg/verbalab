import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetEventFabricProductsBundleQuery,
  ListEventFabricBrokersQuery,
  ListEventFabricCapabilitiesQuery,
} from './messages';
import {
  EVENT_FABRIC_CATALOG_PORT,
  EventFabricBrokerRow,
  EventFabricCapabilityRow,
  EventFabricCatalogPort,
  EventFabricProductsBundle,
} from './ports';

@QueryHandler(ListEventFabricCapabilitiesQuery)
export class ListEventFabricCapabilitiesHandler
  implements IQueryHandler<ListEventFabricCapabilitiesQuery>
{
  constructor(
    @Inject(EVENT_FABRIC_CATALOG_PORT) private readonly catalog: EventFabricCatalogPort,
  ) {}

  execute: Promise<EventFabricCapabilityRow[]> {
    return Promise.resolve(this.catalog.listCapabilities);
  }
}

@QueryHandler(ListEventFabricBrokersQuery)
export class ListEventFabricBrokersHandler
  implements IQueryHandler<ListEventFabricBrokersQuery>
{
  constructor(
    @Inject(EVENT_FABRIC_CATALOG_PORT) private readonly catalog: EventFabricCatalogPort,
  ) {}

  execute: Promise<EventFabricBrokerRow[]> {
    return Promise.resolve(this.catalog.listBrokers);
  }
}

@QueryHandler(GetEventFabricProductsBundleQuery)
export class GetEventFabricProductsBundleHandler
  implements IQueryHandler<GetEventFabricProductsBundleQuery>
{
  constructor(
    @Inject(EVENT_FABRIC_CATALOG_PORT) private readonly catalog: EventFabricCatalogPort,
  ) {}

  execute: Promise<EventFabricProductsBundle> {
    return Promise.resolve(this.catalog.products);
  }
}

export const EVENT_FABRIC_HANDLERS = [
  ListEventFabricCapabilitiesHandler,
  ListEventFabricBrokersHandler,
  GetEventFabricProductsBundleHandler,
];

import { Injectable } from '@nestjs/common';
import { EventFabricService } from '../event-fabric.service';
import {
  eventFabricBrokerCatalog,
  eventFabricCapabilityCatalog,
} from '../event-fabric.catalog';
import {
  EventFabricBrokerRow,
  EventFabricCapabilityRow,
  EventFabricCatalogPort,
  EventFabricProductsBundle,
} from './ports';

@Injectable()
export class NestEventFabricCatalogAdapter implements EventFabricCatalogPort {
  constructor(private readonly fabric: EventFabricService) {}

  products(): EventFabricProductsBundle {
    return this.fabric.products();
  }

  listCapabilities(): EventFabricCapabilityRow[] {
    return eventFabricCapabilityCatalog();
  }

  listBrokers(): EventFabricBrokerRow[] {
    return eventFabricBrokerCatalog();
  }
}

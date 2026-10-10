import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventFabricModule } from '../event-fabric.module';
import { EVENT_FABRIC_CATALOG_PORT } from './ports';
import { NestEventFabricCatalogAdapter } from './nest-event-fabric-catalog.adapter';
import { EVENT_FABRIC_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EventFabricModule],
  providers: [
    NestEventFabricCatalogAdapter,
    { provide: EVENT_FABRIC_CATALOG_PORT, useExisting: NestEventFabricCatalogAdapter },
    ...EVENT_FABRIC_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EventFabricApplicationModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalRoutingControllerModule } from '../global-routing-controller.module';
import { GLOBAL_ROUTING_CONTROLLER_CATALOG_PORT } from './ports';
import { NestGlobalRoutingControllerCatalogAdapter } from './nest-global-routing-controller.adapter';
import { GLOBAL_ROUTING_CONTROLLER_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GlobalRoutingControllerModule],
  providers: [
    NestGlobalRoutingControllerCatalogAdapter,
    { provide: GLOBAL_ROUTING_CONTROLLER_CATALOG_PORT, useExisting: NestGlobalRoutingControllerCatalogAdapter },
    ...GLOBAL_ROUTING_CONTROLLER_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GlobalRoutingControllerApplicationModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ServiceCatalogModule } from '../service-catalog.module';
import { SERVICE_CATALOG_CATALOG_PORT } from './ports';
import { NestServiceCatalogCatalogAdapter } from './nest-service-catalog.adapter';
import { SERVICE_CATALOG_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ServiceCatalogModule],
  providers: [
    NestServiceCatalogCatalogAdapter,
    { provide: SERVICE_CATALOG_CATALOG_PORT, useExisting: NestServiceCatalogCatalogAdapter },
    ...SERVICE_CATALOG_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ServiceCatalogApplicationModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ResourceManagerModule } from '../resource-manager.module';
import { RESOURCE_MANAGER_CATALOG_PORT } from './ports';
import { NestResourceManagerCatalogAdapter } from './nest-resource-manager.adapter';
import { RESOURCE_MANAGER_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ResourceManagerModule],
  providers: [
    NestResourceManagerCatalogAdapter,
    { provide: RESOURCE_MANAGER_CATALOG_PORT, useExisting: NestResourceManagerCatalogAdapter },
    ...RESOURCE_MANAGER_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ResourceManagerApplicationModule {}

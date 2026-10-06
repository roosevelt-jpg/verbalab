import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DataPlaneCloudModule } from '../data-plane-cloud.module';
import { DATA_PLANE_CLOUD_CATALOG_PORT } from './ports';
import { NestDataPlaneCloudCatalogAdapter } from './nest-data-plane-cloud.adapter';
import { DATA_PLANE_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, DataPlaneCloudModule],
  providers: [
    NestDataPlaneCloudCatalogAdapter,
    { provide: DATA_PLANE_CLOUD_CATALOG_PORT, useExisting: NestDataPlaneCloudCatalogAdapter },
    ...DATA_PLANE_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class DataPlaneCloudApplicationModule {}

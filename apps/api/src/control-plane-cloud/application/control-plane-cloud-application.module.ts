import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ControlPlaneCloudModule } from '../control-plane-cloud.module';
import { CONTROL_PLANE_CLOUD_CATALOG_PORT } from './ports';
import { NestControlPlaneCloudCatalogAdapter } from './nest-control-plane-cloud.adapter';
import { CONTROL_PLANE_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ControlPlaneCloudModule],
  providers: [
    NestControlPlaneCloudCatalogAdapter,
    { provide: CONTROL_PLANE_CLOUD_CATALOG_PORT, useExisting: NestControlPlaneCloudCatalogAdapter },
    ...CONTROL_PLANE_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ControlPlaneCloudApplicationModule {}

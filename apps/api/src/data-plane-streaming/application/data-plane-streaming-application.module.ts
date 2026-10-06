import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DataPlaneStreamingModule } from '../data-plane-streaming.module';
import { DATA_PLANE_STREAMING_CATALOG_PORT } from './ports';
import { NestDataPlaneStreamingCatalogAdapter } from './nest-data-plane-streaming.adapter';
import { DATA_PLANE_STREAMING_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, DataPlaneStreamingModule],
  providers: [
    NestDataPlaneStreamingCatalogAdapter,
    { provide: DATA_PLANE_STREAMING_CATALOG_PORT, useExisting: NestDataPlaneStreamingCatalogAdapter },
    ...DATA_PLANE_STREAMING_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class DataPlaneStreamingApplicationModule {}

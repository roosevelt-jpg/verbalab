import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FoundationModelCloudModule } from '../foundation-model-cloud.module';
import { FOUNDATION_MODEL_CLOUD_CATALOG_PORT } from './ports';
import { NestFoundationModelCloudCatalogAdapter } from './nest-foundation-model-cloud-catalog.adapter';
import { FOUNDATION_MODEL_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, FoundationModelCloudModule],
  providers: [
    NestFoundationModelCloudCatalogAdapter,
    {
      provide: FOUNDATION_MODEL_CLOUD_CATALOG_PORT,
      useExisting: NestFoundationModelCloudCatalogAdapter,
    },
    ...FOUNDATION_MODEL_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class FoundationModelCloudApplicationModule {}

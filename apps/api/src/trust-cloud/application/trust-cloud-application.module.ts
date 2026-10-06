import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TrustCloudModule } from '../trust-cloud.module';
import { TRUST_CLOUD_CATALOG_PORT } from './ports';
import { NestTrustCloudCatalogAdapter } from './nest-trust-cloud.adapter';
import { TRUST_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, TrustCloudModule],
  providers: [
    NestTrustCloudCatalogAdapter,
    { provide: TRUST_CLOUD_CATALOG_PORT, useExisting: NestTrustCloudCatalogAdapter },
    ...TRUST_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class TrustCloudApplicationModule {}

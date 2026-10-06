import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EcosystemCloudModule } from '../ecosystem-cloud.module';
import { ECOSYSTEM_CATALOG_PORT } from './ports';
import { NestEcosystemCatalogAdapter } from './nest-ecosystem-catalog.adapter';
import { ECOSYSTEM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EcosystemCloudModule],
  providers: [
    NestEcosystemCatalogAdapter,
    { provide: ECOSYSTEM_CATALOG_PORT, useExisting: NestEcosystemCatalogAdapter },
    ...ECOSYSTEM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EcosystemCloudApplicationModule {}

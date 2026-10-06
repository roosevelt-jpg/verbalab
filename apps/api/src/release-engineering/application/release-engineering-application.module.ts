import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ReleaseEngineeringModule } from '../release-engineering.module';
import { RELEASE_ENGINEERING_CATALOG_PORT } from './ports';
import { NestReleaseEngineeringCatalogAdapter } from './nest-release-engineering.adapter';
import { RELEASE_ENGINEERING_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ReleaseEngineeringModule],
  providers: [
    NestReleaseEngineeringCatalogAdapter,
    { provide: RELEASE_ENGINEERING_CATALOG_PORT, useExisting: NestReleaseEngineeringCatalogAdapter },
    ...RELEASE_ENGINEERING_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ReleaseEngineeringApplicationModule {}

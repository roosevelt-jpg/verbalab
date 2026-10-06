import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PatentInnovationPlatformModule } from '../patent-innovation-platform.module';
import { PATENT_INNOVATION_PLATFORM_CATALOG_PORT } from './ports';
import { NestPatentInnovationPlatformCatalogAdapter } from './nest-patent-innovation-platform.adapter';
import { PATENT_INNOVATION_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, PatentInnovationPlatformModule],
  providers: [
    NestPatentInnovationPlatformCatalogAdapter,
    { provide: PATENT_INNOVATION_PLATFORM_CATALOG_PORT, useExisting: NestPatentInnovationPlatformCatalogAdapter },
    ...PATENT_INNOVATION_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class PatentInnovationPlatformApplicationModule {}

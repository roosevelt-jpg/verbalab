import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AtlasModule } from '../atlas.module';
import { ATLAS_CATALOG_PORT } from './ports';
import { NestAtlasCatalogAdapter } from './nest-atlas-catalog.adapter';
import { ATLAS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AtlasModule],
  providers: [
    NestAtlasCatalogAdapter,
    { provide: ATLAS_CATALOG_PORT, useExisting: NestAtlasCatalogAdapter },
    ...ATLAS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AtlasApplicationModule {}

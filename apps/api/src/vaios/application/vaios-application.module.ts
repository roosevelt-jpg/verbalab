import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { VaiosModule } from '../vaios.module';
import { VAIOS_CATALOG_PORT } from './ports';
import { NestVaiosCatalogAdapter } from './nest-vaios.adapter';
import { VAIOS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, VaiosModule],
  providers: [
    NestVaiosCatalogAdapter,
    { provide: VAIOS_CATALOG_PORT, useExisting: NestVaiosCatalogAdapter },
    ...VAIOS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class VaiosApplicationModule {}

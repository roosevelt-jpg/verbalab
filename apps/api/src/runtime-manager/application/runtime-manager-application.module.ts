import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RuntimeManagerModule } from '../runtime-manager.module';
import { RUNTIME_MANAGER_CATALOG_PORT } from './ports';
import { NestRuntimeManagerCatalogAdapter } from './nest-runtime-manager.adapter';
import { RUNTIME_MANAGER_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, RuntimeManagerModule],
  providers: [
    NestRuntimeManagerCatalogAdapter,
    { provide: RUNTIME_MANAGER_CATALOG_PORT, useExisting: NestRuntimeManagerCatalogAdapter },
    ...RUNTIME_MANAGER_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class RuntimeManagerApplicationModule {}

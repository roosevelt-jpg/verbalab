import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ModelRegistryModule } from '../model-registry.module';
import { MODEL_REGISTRY_CATALOG_PORT } from './ports';
import { NestModelRegistryCatalogAdapter } from './nest-model-registry-catalog.adapter';
import { MODEL_REGISTRY_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ModelRegistryModule],
  providers: [
    NestModelRegistryCatalogAdapter,
    {
      provide: MODEL_REGISTRY_CATALOG_PORT,
      useExisting: NestModelRegistryCatalogAdapter,
    },
    ...MODEL_REGISTRY_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ModelRegistryApplicationModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AfricanLanguageRegistryModule } from '../african-language-registry.module';
import { AFRICAN_LANGUAGE_REGISTRY_CATALOG_PORT } from './ports';
import { NestAfricanLanguageRegistryCatalogAdapter } from './nest-african-language-registry.adapter';
import { AFRICAN_LANGUAGE_REGISTRY_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AfricanLanguageRegistryModule],
  providers: [
    NestAfricanLanguageRegistryCatalogAdapter,
    { provide: AFRICAN_LANGUAGE_REGISTRY_CATALOG_PORT, useExisting: NestAfricanLanguageRegistryCatalogAdapter },
    ...AFRICAN_LANGUAGE_REGISTRY_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AfricanLanguageRegistryApplicationModule {}

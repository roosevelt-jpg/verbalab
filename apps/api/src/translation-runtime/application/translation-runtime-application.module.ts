import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TranslationRuntimeModule } from '../translation-runtime.module';
import { TRANSLATION_RUNTIME_CATALOG_PORT } from './ports';
import { NestTranslationRuntimeCatalogAdapter } from './nest-translation-runtime.adapter';
import { TRANSLATION_RUNTIME_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, TranslationRuntimeModule],
  providers: [
    NestTranslationRuntimeCatalogAdapter,
    { provide: TRANSLATION_RUNTIME_CATALOG_PORT, useExisting: NestTranslationRuntimeCatalogAdapter },
    ...TRANSLATION_RUNTIME_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class TranslationRuntimeApplicationModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EmbeddingRuntimeModule } from '../embedding-runtime.module';
import { EMBEDDING_RUNTIME_CATALOG_PORT } from './ports';
import { NestEmbeddingRuntimeCatalogAdapter } from './nest-embedding-runtime.adapter';
import { EMBEDDING_RUNTIME_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EmbeddingRuntimeModule],
  providers: [
    NestEmbeddingRuntimeCatalogAdapter,
    { provide: EMBEDDING_RUNTIME_CATALOG_PORT, useExisting: NestEmbeddingRuntimeCatalogAdapter },
    ...EMBEDDING_RUNTIME_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EmbeddingRuntimeApplicationModule {}

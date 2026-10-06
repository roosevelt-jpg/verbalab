import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RepositoryStandardsModule } from '../repository-standards.module';
import { REPOSITORY_STANDARDS_CATALOG_PORT } from './ports';
import { NestRepositoryStandardsCatalogAdapter } from './nest-repository-standards.adapter';
import { REPOSITORY_STANDARDS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, RepositoryStandardsModule],
  providers: [
    NestRepositoryStandardsCatalogAdapter,
    { provide: REPOSITORY_STANDARDS_CATALOG_PORT, useExisting: NestRepositoryStandardsCatalogAdapter },
    ...REPOSITORY_STANDARDS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class RepositoryStandardsApplicationModule {}

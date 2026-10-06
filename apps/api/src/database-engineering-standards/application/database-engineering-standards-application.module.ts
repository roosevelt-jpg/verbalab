import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseEngineeringStandardsModule } from '../database-engineering-standards.module';
import { DATABASE_ENGINEERING_STANDARDS_CATALOG_PORT } from './ports';
import { NestDatabaseEngineeringStandardsCatalogAdapter } from './nest-database-engineering-standards.adapter';
import { DATABASE_ENGINEERING_STANDARDS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, DatabaseEngineeringStandardsModule],
  providers: [
    NestDatabaseEngineeringStandardsCatalogAdapter,
    { provide: DATABASE_ENGINEERING_STANDARDS_CATALOG_PORT, useExisting: NestDatabaseEngineeringStandardsCatalogAdapter },
    ...DATABASE_ENGINEERING_STANDARDS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class DatabaseEngineeringStandardsApplicationModule {}

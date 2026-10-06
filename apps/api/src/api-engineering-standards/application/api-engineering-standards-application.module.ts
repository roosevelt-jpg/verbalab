import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ApiEngineeringStandardsModule } from '../api-engineering-standards.module';
import { API_ENGINEERING_STANDARDS_CATALOG_PORT } from './ports';
import { NestApiEngineeringStandardsCatalogAdapter } from './nest-api-engineering-standards.adapter';
import { API_ENGINEERING_STANDARDS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ApiEngineeringStandardsModule],
  providers: [
    NestApiEngineeringStandardsCatalogAdapter,
    { provide: API_ENGINEERING_STANDARDS_CATALOG_PORT, useExisting: NestApiEngineeringStandardsCatalogAdapter },
    ...API_ENGINEERING_STANDARDS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ApiEngineeringStandardsApplicationModule {}

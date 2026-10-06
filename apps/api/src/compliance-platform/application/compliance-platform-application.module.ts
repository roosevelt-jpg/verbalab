import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CompliancePlatformModule } from '../compliance-platform.module';
import { COMPLIANCE_PLATFORM_CATALOG_PORT } from './ports';
import { NestCompliancePlatformCatalogAdapter } from './nest-compliance-platform.adapter';
import { COMPLIANCE_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, CompliancePlatformModule],
  providers: [
    NestCompliancePlatformCatalogAdapter,
    { provide: COMPLIANCE_PLATFORM_CATALOG_PORT, useExisting: NestCompliancePlatformCatalogAdapter },
    ...COMPLIANCE_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class CompliancePlatformApplicationModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ReliabilityEngineeringModule } from '../reliability-engineering.module';
import { RELIABILITY_ENGINEERING_CATALOG_PORT } from './ports';
import { NestReliabilityEngineeringCatalogAdapter } from './nest-reliability-engineering.adapter';
import { RELIABILITY_ENGINEERING_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ReliabilityEngineeringModule],
  providers: [
    NestReliabilityEngineeringCatalogAdapter,
    { provide: RELIABILITY_ENGINEERING_CATALOG_PORT, useExisting: NestReliabilityEngineeringCatalogAdapter },
    ...RELIABILITY_ENGINEERING_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ReliabilityEngineeringApplicationModule {}

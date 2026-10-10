import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FinancialIntelligenceModule } from '../financial-intelligence.module';
import { FINANCIAL_INTELLIGENCE_CATALOG_PORT } from './ports';
import { NestFinancialIntelligenceCatalogAdapter } from './nest-financial-intelligence.adapter';
import { FINANCIAL_INTELLIGENCE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, FinancialIntelligenceModule],
  providers: [
    NestFinancialIntelligenceCatalogAdapter,
    { provide: FINANCIAL_INTELLIGENCE_CATALOG_PORT, useExisting: NestFinancialIntelligenceCatalogAdapter },
    ...FINANCIAL_INTELLIGENCE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class FinancialIntelligenceApplicationModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RiskIntelligenceModule } from '../risk-intelligence.module';
import { RISK_INTELLIGENCE_CATALOG_PORT } from './ports';
import { NestRiskIntelligenceCatalogAdapter } from './nest-risk-intelligence.adapter';
import { RISK_INTELLIGENCE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, RiskIntelligenceModule],
  providers: [
    NestRiskIntelligenceCatalogAdapter,
    { provide: RISK_INTELLIGENCE_CATALOG_PORT, useExisting: NestRiskIntelligenceCatalogAdapter },
    ...RISK_INTELLIGENCE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class RiskIntelligenceApplicationModule {}

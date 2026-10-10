import { Module } from '@nestjs/common';
import { FinancialIntelligenceController } from './financial-intelligence.controller';
import { FinancialIntelligenceService } from './financial-intelligence.service';

@Module({
  controllers: [FinancialIntelligenceController],
  providers: [FinancialIntelligenceService],
  exports: [FinancialIntelligenceService],
})
export class FinancialIntelligenceModule {}

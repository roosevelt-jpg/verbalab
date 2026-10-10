import { Module } from '@nestjs/common';
import { AgriculturalIntelligenceController } from './agricultural-intelligence.controller';
import { AgriculturalIntelligenceService } from './agricultural-intelligence.service';

@Module({
  controllers: [AgriculturalIntelligenceController],
  providers: [AgriculturalIntelligenceService],
  exports: [AgriculturalIntelligenceService],
})
export class AgriculturalIntelligenceModule {}

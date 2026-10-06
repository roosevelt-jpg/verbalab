import { Module } from '@nestjs/common';
import { HealthcareIntelligenceController } from './healthcare-intelligence.controller';
import { HealthcareIntelligenceService } from './healthcare-intelligence.service';

@Module({
  controllers: [HealthcareIntelligenceController],
  providers: [HealthcareIntelligenceService],
  exports: [HealthcareIntelligenceService],
})
export class HealthcareIntelligenceModule {}

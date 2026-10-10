import { Module } from '@nestjs/common';
import { GovernmentIntelligenceController } from './government-intelligence.controller';
import { GovernmentIntelligenceService } from './government-intelligence.service';

@Module({
  controllers: [GovernmentIntelligenceController],
  providers: [GovernmentIntelligenceService],
  exports: [GovernmentIntelligenceService],
})
export class GovernmentIntelligenceModule {}

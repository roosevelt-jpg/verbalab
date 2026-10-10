import { Module } from '@nestjs/common';
import { CulturalIntelligenceController } from './cultural-intelligence.controller';
import { CulturalIntelligenceService } from './cultural-intelligence.service';

@Module({
  controllers: [CulturalIntelligenceController],
  providers: [CulturalIntelligenceService],
  exports: [CulturalIntelligenceService],
})
export class CulturalIntelligenceModule {}

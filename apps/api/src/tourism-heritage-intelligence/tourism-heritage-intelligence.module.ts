import { Module } from '@nestjs/common';
import { TourismHeritageIntelligenceController } from './tourism-heritage-intelligence.controller';
import { TourismHeritageIntelligenceService } from './tourism-heritage-intelligence.service';

@Module({
  controllers: [TourismHeritageIntelligenceController],
  providers: [TourismHeritageIntelligenceService],
  exports: [TourismHeritageIntelligenceService],
})
export class TourismHeritageIntelligenceModule {}

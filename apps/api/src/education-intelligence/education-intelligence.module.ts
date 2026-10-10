import { Module } from '@nestjs/common';
import { EducationIntelligenceController } from './education-intelligence.controller';
import { EducationIntelligenceService } from './education-intelligence.service';

@Module({
  controllers: [EducationIntelligenceController],
  providers: [EducationIntelligenceService],
  exports: [EducationIntelligenceService],
})
export class EducationIntelligenceModule {}

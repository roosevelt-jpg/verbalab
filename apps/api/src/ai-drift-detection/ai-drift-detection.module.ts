import { Module } from '@nestjs/common';
import { AiDriftDetectionController } from './ai-drift-detection.controller';
import { AiDriftDetectionService } from './ai-drift-detection.service';

@Module({
  controllers: [AiDriftDetectionController],
  providers: [AiDriftDetectionService],
  exports: [AiDriftDetectionService],
})
export class AiDriftDetectionModule {}

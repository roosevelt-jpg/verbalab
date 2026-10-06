import { Module } from '@nestjs/common';
import { ReleaseEngineeringController } from './release-engineering.controller';
import { ReleaseEngineeringService } from './release-engineering.service';

@Module({
  controllers: [ReleaseEngineeringController],
  providers: [ReleaseEngineeringService],
  exports: [ReleaseEngineeringService],
})
export class ReleaseEngineeringModule {}

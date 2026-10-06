import { Module } from '@nestjs/common';
import { ReliabilityEngineeringController } from './reliability-engineering.controller';
import { ReliabilityEngineeringService } from './reliability-engineering.service';

@Module({
  controllers: [ReliabilityEngineeringController],
  providers: [ReliabilityEngineeringService],
  exports: [ReliabilityEngineeringService],
})
export class ReliabilityEngineeringModule {}

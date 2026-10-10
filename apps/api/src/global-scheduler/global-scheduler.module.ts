import { Module } from '@nestjs/common';
import { GlobalSchedulerController } from './global-scheduler.controller';
import { GlobalSchedulerService } from './global-scheduler.service';

@Module({
  controllers: [GlobalSchedulerController],
  providers: [GlobalSchedulerService],
  exports: [GlobalSchedulerService],
})
export class GlobalSchedulerModule {}

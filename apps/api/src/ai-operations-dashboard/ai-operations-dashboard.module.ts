import { Module } from '@nestjs/common';
import { AiOperationsDashboardController } from './ai-operations-dashboard.controller';
import { AiOperationsDashboardService } from './ai-operations-dashboard.service';

@Module({
  controllers: [AiOperationsDashboardController],
  providers: [AiOperationsDashboardService],
  exports: [AiOperationsDashboardService],
})
export class AiOperationsDashboardModule {}

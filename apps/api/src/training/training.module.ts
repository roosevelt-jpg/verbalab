import { Module } from '@nestjs/common';
import { TrainingJobsController } from './training-jobs.controller';
import { FineTunesModule } from '../finetunes/finetunes.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [FineTunesModule, IdentityModule],
  controllers: [TrainingJobsController],
})
export class TrainingModule {}

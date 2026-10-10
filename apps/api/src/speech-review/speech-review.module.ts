import { Module } from '@nestjs/common';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { IdentityModule } from '../identity/identity.module';
import { SpeechReviewController } from './speech-review.controller';
import { SpeechReviewService } from './speech-review.service';

@Module({
  imports: [IdentityModule],
  controllers: [SpeechReviewController],
  providers: [SpeechReviewService, PlatformAdminGuard],
  exports: [SpeechReviewService],
})
export class SpeechReviewModule {}

import { Module } from '@nestjs/common';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { IdentityModule } from '../identity/identity.module';
import { VoiceDataAdminController } from './voice-data-admin.controller';
import { VoiceDataSessionController } from './voice-data-session.controller';
import { VoiceDataService } from './voice-data.service';
import { VoiceDataStorage } from './voice-data.storage';

@Module({
  imports: [IdentityModule],
  controllers: [VoiceDataAdminController, VoiceDataSessionController],
  providers: [VoiceDataService, VoiceDataStorage, PlatformAdminGuard],
})
export class VoiceDataModule {}

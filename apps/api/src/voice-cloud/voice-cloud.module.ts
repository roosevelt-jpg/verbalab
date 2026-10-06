import { Module } from '@nestjs/common';
import { VoiceCloudController } from './voice-cloud.controller';
import { VoiceCloudService } from './voice-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [VoiceCloudController],
  providers: [VoiceCloudService],
  exports: [VoiceCloudService],
})
export class VoiceCloudModule {}

import { Module } from '@nestjs/common';
import { SpeechCloudController } from './speech-cloud.controller';
import { SpeechCloudService } from './speech-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [SpeechCloudController],
  providers: [SpeechCloudService],
  exports: [SpeechCloudService],
})
export class SpeechCloudModule {}

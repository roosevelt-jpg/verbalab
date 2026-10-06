import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { VoiceCloudModule } from '../voice-cloud.module';
import { VOICE_CATALOG_PORT } from './ports';
import { NestVoiceCatalogAdapter } from './nest-voice-catalog.adapter';
import { VOICE_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, VoiceCloudModule],
  providers: [
    NestVoiceCatalogAdapter,
    { provide: VOICE_CATALOG_PORT, useExisting: NestVoiceCatalogAdapter },
    ...VOICE_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class VoiceCloudApplicationModule {}

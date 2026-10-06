import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SpeechCloudModule } from '../speech-cloud.module';
import { SPEECH_CATALOG_PORT } from './ports';
import { NestSpeechCatalogAdapter } from './nest-speech-catalog.adapter';
import { SPEECH_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, SpeechCloudModule],
  providers: [
    NestSpeechCatalogAdapter,
    { provide: SPEECH_CATALOG_PORT, useExisting: NestSpeechCatalogAdapter },
    ...SPEECH_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class SpeechCloudApplicationModule {}

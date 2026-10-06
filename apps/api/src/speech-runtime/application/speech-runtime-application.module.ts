import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SpeechRuntimeModule } from '../speech-runtime.module';
import { SPEECH_RUNTIME_CATALOG_PORT } from './ports';
import { NestSpeechRuntimeCatalogAdapter } from './nest-speech-runtime.adapter';
import { SPEECH_RUNTIME_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, SpeechRuntimeModule],
  providers: [
    NestSpeechRuntimeCatalogAdapter,
    { provide: SPEECH_RUNTIME_CATALOG_PORT, useExisting: NestSpeechRuntimeCatalogAdapter },
    ...SPEECH_RUNTIME_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class SpeechRuntimeApplicationModule {}

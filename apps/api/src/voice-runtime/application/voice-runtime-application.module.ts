import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { VoiceRuntimeModule } from '../voice-runtime.module';
import { VOICE_RUNTIME_CATALOG_PORT } from './ports';
import { NestVoiceRuntimeCatalogAdapter } from './nest-voice-runtime.adapter';
import { VOICE_RUNTIME_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, VoiceRuntimeModule],
  providers: [
    NestVoiceRuntimeCatalogAdapter,
    { provide: VOICE_RUNTIME_CATALOG_PORT, useExisting: NestVoiceRuntimeCatalogAdapter },
    ...VOICE_RUNTIME_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class VoiceRuntimeApplicationModule {}

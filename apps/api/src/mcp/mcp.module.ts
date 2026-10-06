import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { TranslateModule } from '../translate/translate.module';
import { AudioModule } from '../audio/audio.module';
import { MixModule } from '../mix/mix.module';
import { AccentsModule } from '../accents/accents.module';
import { VoiceClonesModule } from '../voice-clones/voice-clones.module';
import { LanguagesModule } from '../languages/languages.module';
import { ModelsModule } from '../models/models.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    TranslateModule,
    AudioModule,
    MixModule,
    AccentsModule,
    VoiceClonesModule,
    LanguagesModule,
    ModelsModule,
    ApiKeysModule,
    IdentityModule,
    RateLimitModule,
  ],
  controllers: [McpController],
  providers: [McpService, TranslateAuthGuard],
  exports: [McpService],
})
export class McpModule {}

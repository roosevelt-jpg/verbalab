import { Module } from '@nestjs/common';
import { NeuralTtsController } from './neural-tts.controller';
import { NeuralTtsService } from './neural-tts.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AudioModule } from '../audio/audio.module';
import { AccentsModule } from '../accents/accents.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    AudioModule,
    AccentsModule,
  ],
  controllers: [NeuralTtsController],
  providers: [NeuralTtsService, TranslateAuthGuard],
  exports: [NeuralTtsService],
})
export class NeuralTtsModule {}

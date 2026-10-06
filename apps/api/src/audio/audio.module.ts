import { Module } from '@nestjs/common';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { VoiceClonesModule } from '../voice-clones/voice-clones.module';

@Module({
  imports: [
    GatewayModule,
    UsageModule,
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    VoiceClonesModule,
  ],
  controllers: [AudioController],
  providers: [AudioService, TranslateAuthGuard],
  exports: [AudioService],
})
export class AudioModule {}

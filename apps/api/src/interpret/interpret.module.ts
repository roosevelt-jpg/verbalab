import { Module } from '@nestjs/common';
import { InterpretController } from './interpret.controller';
import { InterpretService } from './interpret.service';
import { AudioModule } from '../audio/audio.module';
import { TranslateModule } from '../translate/translate.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [AudioModule, TranslateModule, ApiKeysModule, IdentityModule, AuditCoreModule],
  controllers: [InterpretController],
  providers: [InterpretService, TranslateAuthGuard],
})
export class InterpretModule {}

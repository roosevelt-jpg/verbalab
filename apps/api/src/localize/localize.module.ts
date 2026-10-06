import { Module } from '@nestjs/common';
import { LocalizeController } from './localize.controller';
import { LocalizeService } from './localize.service';
import { LocalizationPlatformService } from './localization-platform.service';
import { TranslateModule } from '../translate/translate.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [TranslateModule, ApiKeysModule, IdentityModule, AuditCoreModule],
  controllers: [LocalizeController],
  providers: [LocalizeService, LocalizationPlatformService, TranslateAuthGuard],
  exports: [LocalizeService, LocalizationPlatformService],
})
export class LocalizeModule {}

import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { LanguagePassportController } from './passport.controller';
import { LanguagePassportService } from './passport.service';

@Module({
  imports: [IdentityModule, ApiKeysModule, AuditCoreModule],
  controllers: [LanguagePassportController],
  providers: [LanguagePassportService, TranslateAuthGuard],
  exports: [LanguagePassportService],
})
export class LanguagePassportModule {}

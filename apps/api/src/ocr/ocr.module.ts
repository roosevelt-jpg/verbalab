import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { GatewayModule } from '../gateway/gateway.module';
import { TranslateModule } from '../translate/translate.module';
import { UsageModule } from '../usage/usage.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    GatewayModule,
    TranslateModule,
    UsageModule,
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
  ],
  controllers: [OcrController],
  providers: [OcrService, TranslateAuthGuard],
  exports: [OcrService],
})
export class OcrModule {}

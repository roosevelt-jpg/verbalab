import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';

@Module({
  imports: [IdentityModule, PrismaModule, ApiKeysModule, AuditCoreModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, TranslateAuthGuard, ApiKeyGuard, ClerkAuthGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

import { Module } from '@nestjs/common';
import { IntelligenceAnalyticsController } from './intelligence-analytics.controller';
import { IntelligenceAnalyticsService } from './intelligence-analytics.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, PrismaModule],
  controllers: [IntelligenceAnalyticsController],
  providers: [IntelligenceAnalyticsService, TranslateAuthGuard],
  exports: [IntelligenceAnalyticsService],
})
export class IntelligenceAnalyticsModule {}

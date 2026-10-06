import { Module } from '@nestjs/common';
import { AiRuntimeAnalyticsController } from './ai-runtime-analytics.controller';
import { AiRuntimeAnalyticsService } from './ai-runtime-analytics.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, PrismaModule],
  controllers: [AiRuntimeAnalyticsController],
  providers: [AiRuntimeAnalyticsService, TranslateAuthGuard],
  exports: [AiRuntimeAnalyticsService],
})
export class AiRuntimeAnalyticsModule {}

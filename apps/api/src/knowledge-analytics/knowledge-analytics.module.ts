import { Module } from '@nestjs/common';
import { KnowledgeAnalyticsController } from './knowledge-analytics.controller';
import { KnowledgeAnalyticsService } from './knowledge-analytics.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, PrismaModule],
  controllers: [KnowledgeAnalyticsController],
  providers: [KnowledgeAnalyticsService, TranslateAuthGuard],
  exports: [KnowledgeAnalyticsService],
})
export class KnowledgeAnalyticsModule {}

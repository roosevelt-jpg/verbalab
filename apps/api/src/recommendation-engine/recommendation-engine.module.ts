import { Module } from '@nestjs/common';
import { RecommendationEngineController } from './recommendation-engine.controller';
import { RecommendationEngineService } from './recommendation-engine.service';
import { LanguagesModule } from '../languages/languages.module';
import { NeuralTtsModule } from '../neural-tts/neural-tts.module';
import { VoiceMarketplaceModule } from '../voice-marketplace/voice-marketplace.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { MemoryCloudModule } from '../memory-cloud/memory-cloud.module';
import { EmbeddingCloudModule } from '../embedding-cloud/embedding-cloud.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    LanguagesModule,
    NeuralTtsModule,
    VoiceMarketplaceModule,
    KnowledgeModule,
    MemoryCloudModule,
    EmbeddingCloudModule,
    IdentityModule,
    PrismaModule,
    ApiKeysModule,
    AuditCoreModule,
  ],
  controllers: [RecommendationEngineController],
  providers: [RecommendationEngineService, TranslateAuthGuard],
  exports: [RecommendationEngineService],
})
export class RecommendationEngineModule {}

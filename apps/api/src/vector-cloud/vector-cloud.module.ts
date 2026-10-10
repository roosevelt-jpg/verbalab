import { Module } from '@nestjs/common';
import { VectorCloudController } from './vector-cloud.controller';
import { VectorCloudService } from './vector-cloud.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [KnowledgeModule, IdentityModule, PrismaModule, ApiKeysModule],
  controllers: [VectorCloudController],
  providers: [VectorCloudService, TranslateAuthGuard],
  exports: [VectorCloudService],
})
export class VectorCloudModule {}

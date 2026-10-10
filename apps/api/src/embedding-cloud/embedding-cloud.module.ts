import { Module } from '@nestjs/common';
import { EmbeddingCloudController } from './embedding-cloud.controller';
import { EmbeddingCloudService } from './embedding-cloud.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [EmbeddingsModule, IdentityModule, PrismaModule, ApiKeysModule],
  controllers: [EmbeddingCloudController],
  providers: [EmbeddingCloudService, TranslateAuthGuard],
  exports: [EmbeddingCloudService],
})
export class EmbeddingCloudModule {}

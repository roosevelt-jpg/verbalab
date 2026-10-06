import { Module } from '@nestjs/common';
import { KnowledgeFabricController } from './knowledge-fabric.controller';
import { KnowledgeFabricService } from './knowledge-fabric.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { KnowledgeCloudModule } from '../knowledge-cloud/knowledge-cloud.module';
import { EnterpriseSearchModule } from '../enterprise-search/enterprise-search.module';
import { EventFabricModule } from '../event-fabric/event-fabric.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    UsageModule,
    IdentityModule,
    PrismaModule,
    KnowledgeCloudModule,
    EnterpriseSearchModule,
    EventFabricModule,
    ApiKeysModule,
  ],
  controllers: [KnowledgeFabricController],
  providers: [KnowledgeFabricService, TranslateAuthGuard],
  exports: [KnowledgeFabricService],
})
export class KnowledgeFabricModule {}

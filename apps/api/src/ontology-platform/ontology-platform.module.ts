import { Module } from '@nestjs/common';
import { OntologyPlatformController } from './ontology-platform.controller';
import { OntologyPlatformService } from './ontology-platform.service';
import { KnowledgeGraphModule } from '../knowledge-graph/knowledge-graph.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    KnowledgeGraphModule,
    IdentityModule,
    PrismaModule,
    ApiKeysModule,
    AuditCoreModule,
  ],
  controllers: [OntologyPlatformController],
  providers: [OntologyPlatformService, TranslateAuthGuard],
  exports: [OntologyPlatformService],
})
export class OntologyPlatformModule {}

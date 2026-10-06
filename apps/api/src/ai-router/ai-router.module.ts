import { Module } from '@nestjs/common';
import { AiRouterController } from './ai-router.controller';
import { AiRouterService } from './ai-router.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { CostOptimizationModule } from '../cost-optimization/cost-optimization.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    ApiKeysModule,
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    CostOptimizationModule,
  ],
  controllers: [AiRouterController],
  providers: [AiRouterService, TranslateAuthGuard],
  exports: [AiRouterService],
})
export class AiRouterModule {}

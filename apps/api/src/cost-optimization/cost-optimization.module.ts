import { Module } from '@nestjs/common';
import { CostOptimizationController } from './cost-optimization.controller';
import { CostOptimizationService } from './cost-optimization.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [CostOptimizationController],
  providers: [CostOptimizationService, TranslateAuthGuard],
  exports: [CostOptimizationService],
})
export class CostOptimizationModule {}

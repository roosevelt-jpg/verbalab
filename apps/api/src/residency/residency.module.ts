import { Module } from '@nestjs/common';
import { ResidencyController } from './residency.controller';
import { ResidencyService } from './residency.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, AuditCoreModule],
  controllers: [ResidencyController],
  providers: [ResidencyService],
  exports: [ResidencyService],
})
export class ResidencyModule {}

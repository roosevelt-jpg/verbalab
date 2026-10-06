import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from './audit-core.module';

@Module({
  imports: [IdentityModule, AuditCoreModule],
  controllers: [AuditController],
})
export class AuditModule {}

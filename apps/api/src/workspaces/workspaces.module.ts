import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { IdentityModule } from '../identity/identity.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [IdentityModule, BillingModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}

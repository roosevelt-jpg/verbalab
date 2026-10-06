import { Module } from '@nestjs/common';
import { OrganizationControlController } from './organization-control.controller';
import { OrganizationControlService } from './organization-control.service';

@Module({
  controllers: [OrganizationControlController],
  providers: [OrganizationControlService],
  exports: [OrganizationControlService],
})
export class OrganizationControlModule {}

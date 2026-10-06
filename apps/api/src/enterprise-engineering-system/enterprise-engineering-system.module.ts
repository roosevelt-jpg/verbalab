import { Module } from '@nestjs/common';
import { EnterpriseEngineeringSystemController } from './enterprise-engineering-system.controller';
import { EnterpriseEngineeringSystemService } from './enterprise-engineering-system.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [EnterpriseEngineeringSystemController],
  providers: [EnterpriseEngineeringSystemService],
  exports: [EnterpriseEngineeringSystemService],
})
export class EnterpriseEngineeringSystemModule {}

import { Module } from '@nestjs/common';
import { VaiosController } from './vaios.controller';
import { VaiosService } from './vaios.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [VaiosController],
  providers: [VaiosService],
  exports: [VaiosService],
})
export class VaiosModule {}

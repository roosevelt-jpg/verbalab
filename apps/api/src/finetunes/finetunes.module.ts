import { Module } from '@nestjs/common';
import { FineTunesController } from './finetunes.controller';
import { FineTunesService } from './finetunes.service';
import { EvalModule } from '../eval/eval.module';
import { GatewayModule } from '../gateway/gateway.module';
import { BillingModule } from '../billing/billing.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [EvalModule, GatewayModule, BillingModule, IdentityModule],
  controllers: [FineTunesController],
  providers: [FineTunesService],
  exports: [FineTunesService],
})
export class FineTunesModule {}
